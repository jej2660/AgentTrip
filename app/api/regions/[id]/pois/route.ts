import { NextResponse } from 'next/server';
import seedPois from '@/lib/data/regions/dongincheon/pois.json';
import seedParkings from '@/lib/data/regions/dongincheon/parkings.json';
import seedThemes from '@/lib/data/regions/dongincheon/themes.json';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  if (id !== 'dongincheon') {
    return NextResponse.json({ error: 'Region not found' }, { status: 404 });
  }

  return NextResponse.json({
    regionId: 'dongincheon',
    regionName: '동인천·개항장',
    pois: seedPois,
    parkings: seedParkings,
    themes: seedThemes,
  });
}
