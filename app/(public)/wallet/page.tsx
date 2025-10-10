import { WalletSummary } from '@/components/wallet/wallet-summary';

export const metadata = {
  title: 'Wallet de créditos | TKN Social'
};

export default function WalletPage() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold">Wallet de Créditos (TKN)</h1>
        <p className="text-sm text-text-muted">
          Compra packs corporativos, revisa splits de créditos y controla tu balance disponible para retiros.
        </p>
      </div>
      <WalletSummary />
    </div>
  );
}
