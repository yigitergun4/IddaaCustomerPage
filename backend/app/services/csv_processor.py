import pandas as pd
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
    - Column 1: member_id (required)
    - Column 2: dealer_name (optional)
    
    Args:
        file: CSV file buffer
        db: Database session
        replace_all: If True, clear existing whitelist before import
    
    Returns:
        Dict with import statistics
    """
    try:
        # Read CSV
        df = pd.read_csv(file)
        
        # Normalize column names
        df.columns = df.columns.str.strip().str.lower()
        
        # Ensure member_id column exists
        if 'member_id' not in df.columns:
            # Try common alternatives
            for col in ['memberid', 'id', 'uye_no', 'uye_numarasi']:
                if col in df.columns:
                    df.rename(columns={col: 'member_id'}, inplace=True)
                    break
            else:
                return {
                    "success": False,
                    "error": "CSV dosyasında 'member_id' sütunu bulunamadı.",
                    "imported": 0
                }
        
        # Clean member_id values
        df['member_id'] = df['member_id'].astype(str).str.strip().str.upper()
        df = df[df['member_id'].notna() & (df['member_id'] != '')]
        
        # Get dealer_name if exists
        if 'dealer_name' not in df.columns:
            for col in ['name', 'bayi_adi', 'bayi_ismi', 'ad']:
                if col in df.columns:
                    df.rename(columns={col: 'dealer_name'}, inplace=True)
                    break
        
        if replace_all:
            # Clear existing whitelist
            await db.execute(delete(DealerWhitelist))
        
        # Import new entries
        imported_count = 0
        skipped_count = 0
        
        for _, row in df.iterrows():
            member_id = row['member_id']
            dealer_name = row.get('dealer_name', None)
            
            # Check for duplicates
            from sqlalchemy import select
            stmt = select(DealerWhitelist).where(DealerWhitelist.member_id == member_id)
            result = await db.execute(stmt)
            existing = result.scalar_one_or_none()
            
            if existing:
                # Update existing
                existing.dealer_name = dealer_name
                existing.updated_at = datetime.utcnow()
                skipped_count += 1
            else:
                # Create new entry
                dealer = DealerWhitelist(
                    member_id=member_id,
                    dealer_name=dealer_name if pd.notna(dealer_name) else None,
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
            "message": f"{imported_count} yeni bayi eklendi, {skipped_count} bayi güncellendi."
        }
        
    except Exception as e:
        await db.rollback()
        return {
            "success": False,
            "error": f"CSV işleme hatası: {str(e)}",
            "imported": 0
        }
