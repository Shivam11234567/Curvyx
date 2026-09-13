from typing import Optional
from decimal import Decimal
from pydantic import BaseModel

class CreatePaymentOrderRequest(BaseModel):
    order_id: str

class CreatePaymentOrderResponse(BaseModel):
    order_id: str
    order_number: str
    razorpay_order_id: str
    amount: Decimal
    currency: str
    key_id: str

class VerifyPaymentRequest(BaseModel):
    order_id: str
    razorpay_order_id: str
    razorpay_payment_id: str
    razorpay_signature: str

class PaymentResponse(BaseModel):
    id: str
    order_id: str
    razorpay_order_id: str
    razorpay_payment_id: Optional[str] = None
    amount: Decimal
    currency: str
    status: str

    class Config:
        from_attributes = True
