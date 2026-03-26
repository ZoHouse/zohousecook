import { useState, useCallback, useEffect } from 'react';
import { supabase } from '../../configs/supabase';
import type { IoTDevice, IoTCamera, DeviceCategory } from '../../types/iot';

interface UseIoTDevicesResult {
  devices: IoTDevice[];
  isLoading: boolean;
  error: string | null;
  refetch: () => void;
}

/** Fetch all IoT devices for an operator, optionally filtered by category */
export function useIoTDevices(operatorCode: string | undefined, category?: DeviceCategory): UseIoTDevicesResult {
  const [devices, setDevices] = useState<IoTDevice[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDevices = useCallback(async () => {
    if (!operatorCode) {
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    setError(null);

    let query = supabase
      .from('iot_devices_public')
      .select('*')
      .eq('operator_code', operatorCode)
      .order('category')
      .order('name');

    if (category) {
      query = query.eq('category', category);
    }

    const { data, error: err } = await query;

    if (err) {
      setError(err.message);
      setDevices([]);
    } else {
      setDevices((data as IoTDevice[]) || []);
    }
    setIsLoading(false);
  }, [operatorCode, category]);

  useEffect(() => {
    fetchDevices();
  }, [fetchDevices]);

  return { devices, isLoading, error, refetch: fetchDevices };
}

interface UseIoTCamerasResult {
  cameras: IoTCamera[];
  featured: IoTCamera | null;
  isLoading: boolean;
  error: string | null;
  refetch: () => void;
}

/** Convenience wrapper: fetches only camera devices */
export function useIoTCameras(operatorCode: string | undefined): UseIoTCamerasResult {
  const { devices, isLoading, error, refetch } = useIoTDevices(operatorCode, 'camera');

  const cameras = devices as IoTCamera[];
  const featured = cameras.find((c) => c.is_featured) || cameras[0] || null;

  return { cameras, featured, isLoading, error, refetch };
}
