# standards/base_standard.py
from abc import ABC, abstractmethod

class BaseStandard(ABC):
    def __init__(self):
        self.categories = {}

    @abstractmethod
    def build(self):
        pass