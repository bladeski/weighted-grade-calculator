document.addEventListener('DOMContentLoaded', () => {

  const calculatorContainer = document.getElementById('CalculatorContainer') as HTMLDivElement;

  document.getElementById('AddItem')?.addEventListener('click', () => {
    addItem();
  });

  // Listen for value-changed events and recalculate total
  calculatorContainer.addEventListener('value-changed', () => {
    updateTotal();
  });
  // Listen for item-removed events and recalculate total
  calculatorContainer.addEventListener('item-removed', () => {
    setTimeout(() => updateTotal());
  });

  const targetMarkInput = document.getElementById('TargetMark') as HTMLInputElement;
  targetMarkInput.addEventListener('input', () => {
    const items = calculatorContainer.querySelectorAll('calculator-item') as NodeListOf<CalculatorItem>;
    const totalGrade = getTotalGrade(items);
    updateTargetMarks(totalGrade, items);
  });

  addItem(50); // Add the first item on load
  addItem(); // Add the second item on load

  function addItem(percentage: number = 100) {
    const items = calculatorContainer.querySelectorAll('calculator-item') as NodeListOf<CalculatorItem>;
    const newItem = document.createElement('calculator-item');
    // Calculate the remaining percentage
    const usedPercent = getTotalPercentage(items);
    const remaining = Math.min(percentage, Math.max(0, 100 - usedPercent));
    if (remaining > 0) {
      newItem.setAttribute('percent', remaining.toString());
    }
    calculatorContainer.appendChild(newItem);
  }

  function updateTotal() {
    const items = calculatorContainer.querySelectorAll('calculator-item') as NodeListOf<CalculatorItem>;
    const totalPercentage = getTotalPercentage(items);
    const totalGrade = getTotalGrade(items);
    const remaining = 100 - totalPercentage;

    if (totalPercentage >= 100) {
      (document.getElementById('AddItem') as HTMLButtonElement)!.disabled = true;
    } else {
      (document.getElementById('AddItem') as HTMLButtonElement)!.disabled = false;
    }

    items.forEach(item => {
      item.setAttribute('percentremaining', remaining.toString());
    });
    
    document.getElementById('TotalMarksValue')!.textContent = totalGrade.toFixed(2);
    updateTargetMarks(totalGrade, items);
  }

  function getTotalPercentage(items: NodeListOf<CalculatorItem>): number {
    let totalPercent = 0;
    items.forEach(item => {
      let percent = item.hasAttribute('percent') ? parseFloat(item.getAttribute('percent') || '0') : 0;
      if (isNaN(percent) || percent < 1) {
        percent = 1;
        item.setAttribute('percent', percent.toString());
      }
      totalPercent += percent;
    });
    return totalPercent;
  }

  function getTotalGrade(items: NodeListOf<CalculatorItem>): number {
    let total = 0;
    items.forEach(item => {
      total += item.value || parseFloat(item.getAttribute('value')) || 0;
    });
    return total;
  }

  function updateTargetMarks(totalGrade: number, items: NodeListOf<CalculatorItem>) {
    const targetValue = parseInt((document.getElementById('TargetMark') as HTMLInputElement)!.value) || 0;

    calculateTargetMarks(targetValue, totalGrade).forEach((target, index) => {
      items[index].setAttribute('data-target-mark', target?.toFixed(2).toString() || '');
    });
  }

  function calculateTargetMarks(target: number, totalGrade: number) {
    const needed = target - totalGrade;
    const items = calculatorContainer.querySelectorAll('calculator-item');
    const values: {mark: number, percent: number}[] = [];

    items.forEach(item => {
      const percent = parseInt(item.getAttribute('percent'));
      const mark = parseInt(item.getAttribute('mark'));
      values.push({mark: isNaN(mark) ? 0 : mark, percent: isNaN(percent) ? 0 : percent});
    });
    const percentageLeft = values.reduce((acc, {mark, percent}) => mark === 0 && acc + percent, 0);

    return values.map(({mark, percent}) => {
      if (needed > 0 && (isNaN(mark) || mark === 0) && !isNaN(percent)) {
        return (needed / percentageLeft * 100);
      }
      return null;
    });
  }
});

import CalculatorItem from './CalculatorItem/CalculatorItem';

customElements.define('calculator-item', CalculatorItem);