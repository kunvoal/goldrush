'use client';

import { useRiseFallTrading } from '../hooks/use-rise-fall-trading';
import { useDerivWSContext } from '@/components/custom/deriv-ws-provider';
import { RiseFallView } from '../components/rise-fall-view';

export default function UpDownStrategyPage() {
  const { ws, isConnected, isExhausted, auth } = useDerivWSContext();
  const { authState, accounts, activeAccount } = auth;

  const trading = useRiseFallTrading({ 
    ws, 
    isConnected, 
    isExhausted,
    gameState: authState,
    isAuthenticated: authState === 'authenticated',
    onAuthWSFailed: auth.logout
  });

  return (
    <RiseFallView
      authState={authState}
      accounts={accounts}
      activeAccount={activeAccount}
      onLogin={auth.login}
      onSignUp={auth.signUp}
      onLogout={auth.logout}
      onSwitchAccount={auth.switchAccount}
      trading={trading}
    />
  );
}