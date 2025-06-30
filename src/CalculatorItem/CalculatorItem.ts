class CalculatorItem extends HTMLElement {
  private markInput: HTMLInputElement | null = null;
  private percentInput: HTMLInputElement | null = null;
  percentRemaining: string;

  static get observedAttributes() {
    return ['percent', 'percentremaining'];
  }

  constructor() {
    super();
  }

  connectedCallback() {
    const shadow = this.attachShadow({ mode: 'open' });
    const template = document.getElementById('CalculatorItemTemplate') as HTMLTemplateElement;
    if (!template) {
      throw new Error('CalculatorItemTemplate not found in the document');
    }
    shadow.appendChild(template.content.cloneNode(true));

    // Dynamically load the CSS
    Promise.all([
      fetch(new URL('./CalculatorItem.css', import.meta.url)).then(res => res.text())
    ]).then(([css]) => {
      const style = document.createElement('style');
      style.textContent = css;
      shadow.appendChild(style);
    });

    // Get the two inputs from the shadow DOM
    setTimeout(() => {
      const inputs = this.shadowRoot?.querySelectorAll('input');
      if (inputs && inputs.length === 3) {
        this.markInput = inputs[2] as HTMLInputElement;
        this.percentInput = inputs[1] as HTMLInputElement;

        // Pre-populate percent if attribute is set
        if (this.hasAttribute('percent') && this.percentInput) {
          this.percentInput.value = this.getAttribute('percent') || '';
        }

        // Listen for input events to update value and validity
        this.markInput.addEventListener('input', () => this.updateValueAndValidity());
        this.percentInput.addEventListener('input', () => this.updateValueAndValidity());
      }
      this.updateValueAndValidity();

      const removeButton = this.shadowRoot?.querySelector('.remove-item') as HTMLButtonElement;
      if (removeButton) {
        removeButton.addEventListener('click', () => {
          this.dispatchEvent(new CustomEvent('item-removed', {
            bubbles: true,
            composed: true
          }));
          this.remove();
        });
      }
    }, 0);
  }

  attributeChangedCallback(name: string, oldValue: string, newValue: string) {
    if (oldValue === newValue) return; // No change

    if (name === 'percent' && this.percentInput) {
      this.percentInput.value = newValue;
      this.updateValueAndValidity();
    } else if (name === 'percentremaining') {
      // Handle percentRemaining attribute if needed
      const percentRemaining = parseFloat(newValue);
      if (!isNaN(percentRemaining) && this.percentInput) {
        const currentPercent = parseFloat(this.percentInput.value || '0');
        this.percentInput.max = Math.min(100, currentPercent + percentRemaining).toString();
      }
    }
  }

  updateValueAndValidity() {
    const mark = parseFloat(this.markInput?.value || '0');
    const percent = parseFloat(this.percentInput?.value || '0');
    let value = 0;
    if (!isNaN(mark) && !isNaN(percent)) {
      value = mark * percent / 100;
    }
    this.setAttribute('mark', mark.toString());
    this.setAttribute('value', value.toString());
    this.setAttribute('percent', this.percentInput?.value || '0');
    this.dispatchEvent(new CustomEvent('value-changed', {
      detail: { value },
      bubbles: true,
      composed: true
    }));

    // Set validity on the host element based on input validity
    if (this.markInput && this.percentInput) {
      if (!this.markInput.checkValidity() || !this.percentInput.checkValidity()) {
        this.setAttribute('invalid', '');
        this.removeAttribute('valid');
      } else {
        this.setAttribute('valid', '');
        this.removeAttribute('invalid');
      }
    }
  }

  get value(): number {
    return parseFloat(this.getAttribute('value') || '0');
  }
}

export default CalculatorItem;
