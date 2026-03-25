import { useState, useCallback, useEffect } from 'react';
import { supabase } from '../../configs/supabase';
import type { IoTCamera } from '../../types/iot';

interface UseIoTCamerasResult {
  cameras: IoTCamera[];
  featured: IoTCamera | null;
  isLoading: boolean;
  error: string | null;
  refetch: () => void;
}

export function useIoTCameras(operatorCode: string | undefined): UseIoTCamerasResult {
  const [cameras, setCameras] = useState<IoTCamera[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchCameras = useCallback(async () => {
    if (!operatorCode) return;
    setIsLoading(true);
    setError(null);

    const { data, error: err } = await supabase
      .from('iot_cameras_public')
      .select('*')
      .eq('operator_code', operatorCode)
      .order('is_featured', { ascending: false })
      .order('name');

    if (err) {
      setError(err.message);
      setCameras([]);
    } else {
      setCameras((data as IoTCamera[]) || []);
    }
    setIsLoading(false);
  }, [operatorCode]);

  useEffect(() => {
    fetchCameras();
  }, [fetchCameras]);

  const featured = cameras.find((c) => c.is_featured) || cameras[0] || null;

  return { cameras, featured, isLoading, error, refetch: fetchCameras };
}
