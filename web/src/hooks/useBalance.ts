import { useBalance as useWagmiBalance } from 'wagmi';
import { formatEther } from 'viem';

// Custom hook that wraps wagmi's useBalance
export const useBalance = (address?: string) => {
  const { data, refetch, ...rest } = useWagmiBalance({
    address: address as `0x${string}` | undefined,
  });

  return {
    balance: data?.value ? formatEther(data.value) : '0.0000',
    refetch,
    ...rest,
  };
};