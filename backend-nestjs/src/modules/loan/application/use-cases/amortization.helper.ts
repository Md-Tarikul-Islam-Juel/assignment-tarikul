/**
 * Standard loan amortization: equal monthly payment (principal + interest).
 * Monthly payment M = P * r * (1+r)^n / ((1+r)^n - 1)
 * where P = principal, r = monthly interest rate (annual/12/100), n = number of payments.
 */
export interface AmortizationInstallment {
  installmentNumber: number;
  dueDate: Date;
  principalAmount: number;
  interestAmount: number;
  totalAmount: number;
}

export function calculateAmortizationSchedule(
  principal: number,
  annualInterestRatePercent: number,
  termMonths: number,
  firstDueDate: Date,
): AmortizationInstallment[] {
  const schedule: AmortizationInstallment[] = [];
  const r = annualInterestRatePercent / 12 / 100;
  const n = termMonths;

  if (r === 0) {
    const payment = principal / n;
    for (let i = 1; i <= n; i++) {
      const dueDate = new Date(firstDueDate);
      dueDate.setMonth(dueDate.getMonth() + i);
      schedule.push({
        installmentNumber: i,
        dueDate,
        principalAmount: i === n ? Math.round((principal - (i - 1) * payment) * 100) / 100 : Math.round(payment * 100) / 100,
        interestAmount: 0,
        totalAmount: i === n ? Math.round((principal - (i - 1) * payment) * 100) / 100 : Math.round(payment * 100) / 100,
      });
    }
    return schedule;
  }

  const monthlyPayment = (principal * r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1);
  let balance = principal;

  for (let i = 1; i <= n; i++) {
    const dueDate = new Date(firstDueDate);
    dueDate.setMonth(dueDate.getMonth() + i);

    const interestAmount = balance * r;
    let principalAmount = monthlyPayment - interestAmount;
    if (i === n) {
      principalAmount = Math.round(balance * 100) / 100;
    }
    const totalAmount = Math.round((principalAmount + interestAmount) * 100) / 100;
    principalAmount = Math.round(principalAmount * 100) / 100;
    const interestRounded = Math.round(interestAmount * 100) / 100;

    schedule.push({
      installmentNumber: i,
      dueDate,
      principalAmount,
      interestAmount: interestRounded,
      totalAmount,
    });

    balance -= principalAmount;
    balance = Math.round(balance * 100) / 100;
  }

  return schedule;
}
