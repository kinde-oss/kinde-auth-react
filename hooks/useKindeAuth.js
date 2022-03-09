import {useContext} from 'react';
import {KindeContext} from '../state/KindeContext';

const useKindeAuth = () => useContext(KindeContext);

export {useKindeAuth};
