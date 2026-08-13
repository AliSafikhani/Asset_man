from .status import Status


class Rule:
    """A single acceptance rule for an IEC 60296 (new oil) parameter.

    Faithful port of the reference algorithm:
      - missing value  -> NOT_OK ("Missing value")
      - boolean rule   -> exact-equality check
      - min/max rule   -> inclusive bounds (strict `<` / `>` fail)
    """

    def __init__(self, min_value=None, max_value=None, boolean=None):
        self.min = min_value
        self.max = max_value
        self.boolean = boolean

    def check(self, value):
        if value is None:
            return Status.NOT_OK, "Missing value"

        if self.boolean is not None:
            if value != self.boolean:
                return Status.NOT_OK, f"Expected {self.boolean}, got {value}"
            return Status.OK, ""

        if self.min is not None and value < self.min:
            return Status.NOT_OK, f"Value {value} is below minimum ({self.min})"

        if self.max is not None and value > self.max:
            return Status.NOT_OK, f"Value {value} is above maximum ({self.max})"

        return Status.OK, ""
