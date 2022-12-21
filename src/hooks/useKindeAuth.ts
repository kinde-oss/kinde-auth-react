import { useContext } from 'react';
import { KindeContext, KindeContextProps } from '../state/KindeContext';

export const useKindeAuth = (): KindeContextProps => {
  const context = useContext(KindeContext);

  if (context === undefined) {
    throw new Error('Oooops! useKindeAuth must be used within a KindeProvider');
  }

  return context;
};
