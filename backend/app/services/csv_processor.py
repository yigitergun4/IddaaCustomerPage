import pandas as pd
import re
from datetime import datetime
from typing import BinaryIO
from sqlalchemy import delete
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.dealer import DealerWhitelist


async def process_dealer_csv(
    file: BinaryIO,
    db: AsyncSession,
    replace_all: bool = True
) -> dict:
    """
    Process dealer whitelist CSV and update database.
    
    Expected CSV format:
    - Column 1: phone (required)
    """
    try:
        # Read CSV
        df = pd.read_csv(file)
        
        # Normalize column names
        df.columns = df.columns.str.strip().str.lower()
        
        # Ensure phone column exists
        if 'phone' not in df.columns:
            # Try common alternatives
            for col in ['telefon', 'tel', 'phone_number']:
                if col in df.columns:
                    df.rename(columns={col: 'phone'}, inplace=True)
                    break
            else:
                return {
                    "success": False,
                    "error": "CSV dosyasında 'phone' veya 'telefon' sütunu bulunamadı.",
                    "imported": 0
                }
        
        # Clean phone values (remove all non-digit characters)
        def clean_phone(val):
            if pd.isna(val):
                return ""
            # Remove all non-digits
            digits = re.sub(r'\D', '', str(val))
            # Optional: adjust depending on local standard (e.g. remove leading 0 or 90)
            # but for this portal let's just keep the digits.
            return digits
            
        df['phone'] = df['phone'].apply(clean_phone)
        df = df[df['phone'] != '']
        
        if replace_all:
            # Clear existing whitelist
            await db.execute(delete(DealerWhitelist))
        
        # Import new entries
        imported_count = 0
        skipped_count = 0
        
        for _, row in df.iterrows():
            phone = row['phone']
            
            # Check for duplicates
            from sqlalchemy import select
            stmt = select(DealerWhitelist).where(DealerWhitelist.phone == phone)
            result = await db.execute(stmt)
            existing = result.scalar_one_or_none()
            
            if existing:
                existing.updated_at = datetime.utcnow()
                skipped_count += 1
            else:
                # Create new entry
                dealer = DealerWhitelist(
                    phone=phone,
                    updated_at=datetime.utcnow()
                )
                db.add(dealer)
                imported_count += 1
        
        await db.commit()
        
        return {
            "success": True,
            "imported": imported_count,
            "updated": skipped_count,
            "total": imported_count + skipped_count,
            "message": f"{imported_count} yeni telefon eklendi, {skipped_count} telefon güncellendi."
        }
        
    except Exception as e:
        await db.rollback()
        return {
            "success": False,
            "error": f"CSV işleme hatası: {str(e)}",
            "imported": 0
        }
