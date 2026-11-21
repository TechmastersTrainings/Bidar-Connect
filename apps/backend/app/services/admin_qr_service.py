import os
import json
from typing import Dict, Any, Optional
from datetime import datetime, timezone

DATA_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "data"))
CONFIG_FILE = os.path.join(DATA_DIR, "admin_payment_qr.json")

DEFAULT_CONFIG: Dict[str, Any] = {
    "upi_id": "9986445390@upi",
    "payee_name": "Shiva Bhalke",
    "business_name": "Bidar Connect",
    "qr_image_url": "https://api.qrserver.com/v1/create-qr-code/?size=250x250&margin=4&data=upi%3A%2F%2Fpay%3Fpa%3D9986445390%40upi%26pn%3DShiva%2520Bhalke%26cu%3DINR%26tn%3DBidarConnect",
    "qr_image_data": None,
    "instructions": "Scan with any UPI app (GPay, PhonePe, Paytm, BHIM). Platform Escrow collects payments securely.",
    "updated_at": "2026-11-05T08:00:00+05:30",
}


def get_admin_qr_config() -> Dict[str, Any]:
    os.makedirs(DATA_DIR, exist_ok=True)
    if os.path.exists(CONFIG_FILE):
        try:
            with open(CONFIG_FILE, "r", encoding="utf-8") as f:
                saved = json.load(f)
                return {**DEFAULT_CONFIG, **saved}
        except Exception as e:
            print(f"Warning reading admin QR config: {e}")
    return dict(DEFAULT_CONFIG)


def update_admin_qr_config(
    upi_id: str,
    payee_name: str,
    business_name: Optional[str] = "Bidar Connect",
    qr_image_data: Optional[str] = None,
    instructions: Optional[str] = None,
) -> Dict[str, Any]:
    os.makedirs(DATA_DIR, exist_ok=True)
    clean_upi = upi_id.strip()
    clean_payee = payee_name.strip()
    clean_biz = (business_name or "Bidar Connect").strip()

    # Generate fallback dynamic QR URL if no custom image data provided
    dynamic_qr_url = f"https://api.qrserver.com/v1/create-qr-code/?size=250x250&margin=4&data=upi%3A%2F%2Fpay%3Fpa%3D{clean_upi}%26pn%3D{clean_payee.replace(' ', '%20')}%26cu%3DINR%26tn%3DBidarConnect"

    new_config = {
        "upi_id": clean_upi,
        "payee_name": clean_payee,
        "business_name": clean_biz,
        "qr_image_url": dynamic_qr_url,
        "qr_image_data": qr_image_data.strip() if qr_image_data else None,
        "instructions": (instructions or "Scan with any UPI app. Platform Escrow collects payments securely.").strip(),
        "updated_at": datetime.now(timezone.utc).isoformat(),
    }

    try:
        with open(CONFIG_FILE, "w", encoding="utf-8") as f:
            json.dump(new_config, f, indent=2)
    except Exception as e:
        print(f"Error saving admin QR config: {e}")

    return new_config

