# core/status.py
from enum import StrEnum

class Status(StrEnum):
    OK = "OK"
    FAIR = "FAIR"
    NOT_OK = "NOT_OK"