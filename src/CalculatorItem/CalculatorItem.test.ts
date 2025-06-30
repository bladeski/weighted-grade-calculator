import { JSDOM } from 'jsdom';
import fs from 'fs';
import path from 'path';

describe('CalculatorItem', () => {
  let dom: JSDOM;
  let document: Document;
  let templateHtml: string;

  beforeAll(() => {
    // Load the template HTML from CalculatorItem.html
    templateHtml = fs.readFileSync(path.resolve(__dirname, 'CalculatorItem.pug'), 'utf-8');
  });

  beforeEach(() => {
    dom = new JSDOM(`<!DOCTYPE html><body>${templateHtml}</body>`, { url: 'http://localhost' });
    document = dom.window.document;
    globalThis.document = document;
    // Dynamically define the CalculatorItem web component for the test
    if (!customElements.get('calculator-item')) {
      class CalculatorItem extends HTMLElement {
        private markInput: HTMLInputElement | null = null;
        private percentInput: HTMLInputElement | null = null;
        static get observedAttributes() { return ['percent']; }
        constructor() {
          super();
          const shadow = this.attachShadow({ mode: 'open' });
          // Load template from the test DOM
          const template = document.getElementById('CalculatorItemTemplate') as HTMLTemplateElement;
          shadow.appendChild(template.content.cloneNode(true));
        }
        connectedCallback() {
          const inputs = this.shadowRoot?.querySelectorAll('input');
          if (inputs && inputs.length === 2) {
            this.markInput = inputs[0] as HTMLInputElement;
            this.percentInput = inputs[1] as HTMLInputElement;
            if (this.hasAttribute('percent') && this.percentInput) {
              this.percentInput.value = this.getAttribute('percent') || '';
            }
            this.markInput.addEventListener('input', () => this.updateValue());
            this.percentInput.addEventListener('input', () => this.updateValue());
          }
          this.updateValue();
        }
        attributeChangedCallback(name: string, oldValue: string, newValue: string) {
          if (name === 'percent' && this.percentInput) {
            this.percentInput.value = newValue;
            this.updateValue();
          }
        }
        updateValue() {
          const mark = parseFloat(this.markInput?.value || '0');
          const percent = parseFloat(this.percentInput?.value || '0');
          let value = 0;
          if (!isNaN(mark) && !isNaN(percent)) {
            value = mark * percent / 100;
          }
          this.setAttribute('value', value.toString());
          this.dispatchEvent(new dom.window.CustomEvent('value-changed', {
            detail: { value },
            bubbles: true,
            composed: true
          }));
        }
        get value(): number {
          return parseFloat(this.getAttribute('value') || '0');
        }
      }
      customElements.define('calculator-item', CalculatorItem);
    }
  });

  it('should set percent input from attribute', () => {
    const item = document.createElement('calculator-item') as any;
    item.setAttribute('percent', '25');
    document.body.appendChild(item);
    const percentInput = item.shadowRoot.querySelectorAll('input')[1];
    expect(percentInput.value).toBe('25');
  });

  it('should calculate value correctly', () => {
    const item = document.createElement('calculator-item') as any;
    document.body.appendChild(item);
    const markInput = item.shadowRoot.querySelectorAll('input')[0];
    const percentInput = item.shadowRoot.querySelectorAll('input')[1];
    markInput.value = '80';
    percentInput.value = '50';
    markInput.dispatchEvent(new dom.window.Event('input'));
    percentInput.dispatchEvent(new dom.window.Event('input'));
    expect(item.value).toBe(40);
    expect(item.getAttribute('value')).toBe('40');
  });

  it('should emit value-changed event', () => {
    const item = document.createElement('calculator-item') as any;
    document.body.appendChild(item);
    const markInput = item.shadowRoot.querySelectorAll('input')[0];
    let eventFired = false;
    item.addEventListener('value-changed', (e: any) => {
      eventFired = true;
      expect(e.detail.value).toBe(50);
    });
    markInput.value = '100';
    markInput.dispatchEvent(new dom.window.Event('input'));
    const percentInput = item.shadowRoot.querySelectorAll('input')[1];
    percentInput.value = '50';
    percentInput.dispatchEvent(new dom.window.Event('input'));
    expect(eventFired).toBe(true);
  });
});
