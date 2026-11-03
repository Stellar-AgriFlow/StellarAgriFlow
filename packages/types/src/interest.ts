export interface InstallmentPayment {
  installmentNumber: number;
  dueDateTimestamp: number;
  principalDue: number;
  interestDue: number;
  totalPayment: number;
  remainingBalance: number;
}

export interface AmortizationSchedule {
  loanId: number;
  borrower: string;
  totalPrincipal: number;
  totalInterest: number;
  totalPayable: number;
  installments: InstallmentPayment[];
  frequency: 'Monthly' | 'Seasonal' | 'Bullet';
}

export interface PaymentAllocation {
  paymentAmount: number;
  allocatedToLatePenalties: number;
  allocatedToInterest: number;
  allocatedToPrincipal: number;
  surplusRefund: number;
  remainingPrincipal: number;
}

export function generateBulletAmortization(
  loanId: number,
  borrower: string,
  principal: number,
  annualInterestRateBps: number,
  durationDays: number,
  startTimestamp: number = Math.floor(Date.now() / 1000)
): AmortizationSchedule {
  const totalInterest = Math.round(principal * (annualInterestRateBps / 10000) * (durationDays / 365));
  const totalPayable = principal + totalInterest;

  return {
    loanId,
    borrower,
    totalPrincipal: principal,
    totalInterest,
    totalPayable,
    frequency: 'Bullet',
    installments: [
      {
        installmentNumber: 1,
        dueDateTimestamp: startTimestamp + durationDays * 86400,
        principalDue: principal,
        interestDue: totalInterest,
        totalPayment: totalPayable,
        remainingBalance: 0,
      },
    ],
  };
}
