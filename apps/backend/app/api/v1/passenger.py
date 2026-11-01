from typing import List, Optional
from pydantic import BaseModel, Field
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload

from apps.backend.app.database.session import get_db_session
from apps.backend.app.models.user import User, PassengerProfile, EmergencyContact
from apps.backend.app.schemas.common import ApiResponse
from apps.backend.app.core.dependencies import get_current_active_user, require_roles
from apps.backend.app.schemas.auth import UserRole

router = APIRouter(prefix="/passenger", tags=["Passenger Portal"])


class EmergencyContactItem(BaseModel):
    id: Optional[str] = None
    name: str = Field(..., min_length=2, max_length=100)
    phone: str = Field(..., min_length=10, max_length=20)
    relationship_type: str = Field(..., min_length=2, max_length=50)


class PassengerProfileResponse(BaseModel):
    user_id: str
    full_name: str
    phone: str
    email: Optional[str] = None
    preferred_pickup_landmark: Optional[str] = None
    medical_emergency_notes: Optional[str] = None
    total_rides_taken: int = 0
    emergency_contacts: List[EmergencyContactItem] = []


class UpdatePassengerProfileRequest(BaseModel):
    full_name: Optional[str] = None
    preferred_pickup_landmark: Optional[str] = None
    medical_emergency_notes: Optional[str] = None


@router.get("/profile", response_model=ApiResponse[PassengerProfileResponse])
async def get_passenger_profile(
    current_user: User = Depends(require_roles(UserRole.PASSENGER)),
    db: AsyncSession = Depends(get_db_session),
):
    """Retrieves full passenger profile with safety preferences and emergency contacts."""
    stmt = (
        select(User)
        .where(User.id == current_user.id)
        .options(
            selectinload(User.passenger_profile),
            selectinload(User.emergency_contacts),
        )
    )
    res = await db.execute(stmt)
    user = res.scalar_one_or_none()

    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    contacts = [
        EmergencyContactItem(
            id=c.id,
            name=c.name,
            phone=c.phone,
            relationship_type=c.relationship_type,
        )
        for c in user.emergency_contacts
    ]

    p_prof = user.passenger_profile
    return ApiResponse.ok(
        PassengerProfileResponse(
            user_id=user.id,
            full_name=user.full_name,
            phone=user.phone,
            email=user.email,
            preferred_pickup_landmark=p_prof.preferred_pickup_landmark if p_prof else None,
            medical_emergency_notes=p_prof.medical_emergency_notes if p_prof else None,
            total_rides_taken=p_prof.total_rides_taken if p_prof else 0,
            emergency_contacts=contacts,
        )
    )


@router.put("/profile", response_model=ApiResponse[PassengerProfileResponse])
async def update_passenger_profile(
    payload: UpdatePassengerProfileRequest,
    current_user: User = Depends(require_roles(UserRole.PASSENGER)),
    db: AsyncSession = Depends(get_db_session),
):
    """Updates passenger preferences and pickup landmarks."""
    stmt = (
        select(User)
        .where(User.id == current_user.id)
        .options(
            selectinload(User.passenger_profile),
            selectinload(User.emergency_contacts),
        )
    )
    res = await db.execute(stmt)
    user = res.scalar_one_or_none()

    if payload.full_name:
        user.full_name = payload.full_name.strip()

    if not user.passenger_profile:
        user.passenger_profile = PassengerProfile(user_id=user.id)
        db.add(user.passenger_profile)

    if payload.preferred_pickup_landmark is not None:
        user.passenger_profile.preferred_pickup_landmark = payload.preferred_pickup_landmark.strip()

    if payload.medical_emergency_notes is not None:
        user.passenger_profile.medical_emergency_notes = payload.medical_emergency_notes.strip()

    await db.commit()

    # Re-fetch with eager loaded relationships
    reload_stmt = (
        select(User)
        .where(User.id == current_user.id)
        .options(
            selectinload(User.passenger_profile),
            selectinload(User.emergency_contacts),
        )
    )
    reload_res = await db.execute(reload_stmt)
    user = reload_res.scalar_one()

    contacts = [
        EmergencyContactItem(
            id=c.id,
            name=c.name,
            phone=c.phone,
            relationship_type=c.relationship_type,
        )
        for c in user.emergency_contacts
    ]

    return ApiResponse.ok(
        PassengerProfileResponse(
            user_id=user.id,
            full_name=user.full_name,
            phone=user.phone,
            email=user.email,
            preferred_pickup_landmark=user.passenger_profile.preferred_pickup_landmark if user.passenger_profile else None,
            medical_emergency_notes=user.passenger_profile.medical_emergency_notes if user.passenger_profile else None,
            total_rides_taken=user.passenger_profile.total_rides_taken if user.passenger_profile else 0,
            emergency_contacts=contacts,
        )
    )


@router.post("/emergency-contacts", response_model=ApiResponse[EmergencyContactItem])
async def add_emergency_contact(
    payload: EmergencyContactItem,
    current_user: User = Depends(require_roles(UserRole.PASSENGER)),
    db: AsyncSession = Depends(get_db_session),
):
    """Registers an emergency SOS contact for passenger ride safety."""
    contact = EmergencyContact(
        user_id=current_user.id,
        name=payload.name.strip(),
        phone=payload.phone.strip(),
        relationship_type=payload.relationship_type.strip(),
    )
    db.add(contact)
    await db.commit()
    await db.refresh(contact)

    return ApiResponse.ok(
        EmergencyContactItem(
            id=contact.id,
            name=contact.name,
            phone=contact.phone,
            relationship_type=contact.relationship_type,
        )
    )
