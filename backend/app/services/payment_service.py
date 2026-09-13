import hmac
import hashlib
from decimal import Decimal
from typing import Dict, Any, Optional
import razorpay
from fastapi import HTTPException, status
from app.core.config import settings

class PaymentService:
    def __init__(self):
        self.key_id = settings.RAZORPAY_KEY_ID
        self.key_secret = settings.RAZORPAY_KEY_SECRET

    def get_client(self) -> Optional[razorpay.Client]:
        if not self.key_id or not self.key_secret:
            return None
        return razorpay.Client(auth=(self.key_id, self.key_secret))

    def create_razorpay_order(self, amount: Decimal, currency: str = "INR", receipt: str = "") -> Dict[str, Any]:
        amount_in_paise = int(amount * 100)
        client = self.get_client()
        if client and not self.key_id.startswith("rzp_test_placeholder"):
            try:
                order_data = {
                    "amount": amount_in_paise,
                    "currency": currency,
                    "receipt": receipt,
                    "payment_capture": 1
                }
                return client.order.create(data=order_data)
            except Exception as e:
                raise HTTPException(
                    status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                    detail=f"Payment gateway error: {str(e)}"
                )
        return {
            "id": f"order_mock_{receipt}_{int(amount)}",
            "entity": "order",
            "amount": amount_in_paise,
            "currency": currency,
            "receipt": receipt,
            "status": "created"
        }

    def verify_payment_signature(
        self,
        razorpay_order_id: str,
        razorpay_payment_id: str,
        razorpay_signature: str
    ) -> bool:
        if razorpay_order_id.startswith("order_mock_"):
            return True

        if not self.key_secret:
            return False

        msg = f"{razorpay_order_id}|{razorpay_payment_id}".encode("utf-8")
        generated_signature = hmac.new(
            self.key_secret.encode("utf-8"),
            msg,
            hashlib.sha256
        ).hexdigest()

        return hmac.compare_digest(generated_signature, razorpay_signature)

payment_service = PaymentService()
