import { useAddressResolution } from '@/hooks/useAddressResolution';

interface AddressDisplayProps {
  address: string;
  className?: string;
}

/**
 * Component that displays an address with ENS or Base name resolution.
 * Falls back to formatted address if no name is found.
 */
export function AddressDisplay({ address, className }: AddressDisplayProps) {
  const displayName = useAddressResolution(address);

  return (
    <span className={className} title={address}>
      {displayName}
    </span>
  );
}
