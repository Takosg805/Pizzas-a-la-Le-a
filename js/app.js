(function () {
  const CART_KEY = 'allende-cart';
  const ADMIN_KEY = 'allende-admin-session';

  function getCart() {
    try {
      const raw = localStorage.getItem(CART_KEY);
      const parsed = raw ? JSON.parse(raw) : [];
      return Array.isArray(parsed) ? parsed : [];
    } catch (error) {
      return [];
    }
  }

  function saveCart(cart) {
    localStorage.setItem(CART_KEY, JSON.stringify(cart));
  }

  function updateCartBadge() {
    const badge = document.querySelector('.badge');
    if (!badge) return;

    const cart = getCart();
    const count = cart.reduce((sum, item) => sum + Number(item.quantity || 0), 0);
    badge.textContent = String(count || 0);
    badge.hidden = count === 0;
  }

  function addToCart(product) {
    const cart = getCart();
    const existing = cart.find((item) => item.name === product.name);

    if (existing) {
      existing.quantity += 1;
    } else {
      cart.push({ ...product, quantity: 1 });
    }

    saveCart(cart);
    updateCartBadge();
  }

  function getProductFromCard(card) {
    const name = card?.querySelector('h3')?.textContent?.trim() || 'Producto';
    const priceText = card?.querySelector('.price')?.textContent || '$0';
    const price = Number(String(priceText).replace(/[^0-9.]/g, '')) || 0;
    const image = card?.querySelector('img')?.src || '';

    return { name, price, image };
  }

  function initHomePage() {
    const grid = document.getElementById('product-grid');
    if (!grid) return;

    const buttons = Array.from(document.querySelectorAll('.seleccion'));
    buttons.forEach((button) => {
      button.addEventListener('click', () => {
        const selected = button.textContent.trim();
        buttons.forEach((item) => {
          const active = item === button;
          item.classList.toggle('active', active);
          item.setAttribute('aria-pressed', String(active));
        });

        const cards = Array.from(grid.querySelectorAll('.contenedor-producto'));
        cards.forEach((card) => {
          const category = selected.toLowerCase();
          const cardName = card.querySelector('h3')?.textContent?.trim().toLowerCase() || '';
          const relevant = category === 'pizzas' ? cardName.includes('peperoni') || cardName.includes('hawaiana') || cardName.includes('especial') : category === 'pastas' ? false : category === 'lasaña' ? false : true;
          card.style.display = relevant ? '' : 'none';
        });
      });
    });

    const addButtons = grid.querySelectorAll('.button.small');
    addButtons.forEach((button) => {
      button.addEventListener('click', () => {
        const card = button.closest('.contenedor-producto');
        if (!card) return;

        addToCart(getProductFromCard(card));
        const originalText = button.textContent;
        button.textContent = 'Agregado';
        button.disabled = true;
        setTimeout(() => {
          button.textContent = originalText;
          button.disabled = false;
        }, 800);
      });
    });

    const downloadButton = document.getElementById('download-menu');
    if (downloadButton) {
      downloadButton.addEventListener('click', () => {
        const products = Array.from(grid.querySelectorAll('.contenedor-producto')).map((card) => {
          const name = card.querySelector('h3')?.textContent?.trim() || 'Producto';
          const price = card.querySelector('.price')?.textContent?.trim() || '$0';
          return `${name}: ${price}`;
        });

        const blob = new Blob([`Menú Allende\n\n${products.join('\n')}`], { type: 'text/plain;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = 'menu-allende.txt';
        link.click();
        URL.revokeObjectURL(url);
      });
    }
  }

  function renderCartPage() {
    const cartList = document.getElementById('cart-list');
    const checkoutEmpty = document.getElementById('checkout-empty');
    const cartSummary = document.getElementById('cart-summary');

    if (!cartList || !checkoutEmpty || !cartSummary) return;

    let cart = getCart();
    if (!cart.length) {
      cart = [
        { name: 'Peperoni', price: 250, quantity: 1, image: 'images/pizza_peperoni.png' },
        { name: 'Hawaiana', price: 250, quantity: 1, image: 'images/pizza_hawaiana.png' }
      ];
      saveCart(cart);
    }

    cartList.innerHTML = cart.map((item, index) => `
      <article class="cart-row" data-index="${index}">
        <img src="${item.image || 'images/logo.png'}" alt="${item.name}">
        <div>
          <h3>${item.name}</h3>
          <p class="small">${item.extras || 'Sin extras'}</p>
          <div class="summary-line">
            <strong>$${(item.price * item.quantity).toFixed(2)}</strong>
            <span class="small">$${Number(item.price).toFixed(2)} c/u</span>
          </div>
          <div class="actions">
            <div class="quantity">
              <button type="button" data-action="decrease" aria-label="Restar una unidad de ${item.name}">−</button>
              <span>${item.quantity}</span>
              <button type="button" data-action="increase" aria-label="Agregar una unidad de ${item.name}">+</button>
            </div>
            <button class="text-button" data-action="remove">Quitar</button>
          </div>
        </div>
      </article>
    `).join('');

    const totalItems = cart.reduce((sum, item) => sum + Number(item.quantity || 0), 0);
    const totalPrice = cart.reduce((sum, item) => sum + Number(item.price || 0) * Number(item.quantity || 0), 0);
    cartSummary.innerHTML = `
      <div class="summary-line">
        <span>Productos</span>
        <span>${totalItems}</span>
      </div>
      <div class="summary-line">
        <span>Entrega</span>
        <span>Por confirmar con el negocio</span>
      </div>
      <div class="summary-line total">
        <span>Total de productos</span>
        <span>$${totalPrice.toFixed(2)}</span>
      </div>
    `;

    const buttons = cartList.querySelectorAll('button[data-action]');
    buttons.forEach((button) => {
      button.addEventListener('click', () => {
        const row = button.closest('.cart-row');
        const index = Number(row?.dataset.index ?? 0);
        if (!Number.isFinite(index)) return;

        if (button.dataset.action === 'increase') {
          cart[index].quantity = (cart[index].quantity || 0) + 1;
        }

        if (button.dataset.action === 'decrease') {
          cart[index].quantity = Math.max((cart[index].quantity || 1) - 1, 0);
          if (cart[index].quantity === 0) {
            cart.splice(index, 1);
          }
        }

        if (button.dataset.action === 'remove') {
          cart.splice(index, 1);
        }

        saveCart(cart);
        renderCartPage();
        updateCartBadge();
      });
    });

    if (!cart.length) {
      checkoutEmpty.hidden = false;
      checkoutEmpty.textContent = 'Tu carrito está vacío. Agrega productos desde el menú.';
      document.getElementById('checkout-layout').hidden = true;
    } else {
      checkoutEmpty.hidden = true;
      document.getElementById('checkout-layout').hidden = false;
    }
  }

  function initCheckoutForm() {
    const form = document.getElementById('checkout-form');
    const deliveryFields = document.getElementById('delivery-fields');
    const errorBox = document.getElementById('checkout-error');
    const deliveryRadios = document.querySelectorAll('input[name="entrega"]');

    if (!form || !deliveryFields || !errorBox) return;

    function updateDeliveryState() {
      const selected = document.querySelector('input[name="entrega"]:checked')?.value || 'A domicilio';
      const isDelivery = selected === 'A domicilio';
      deliveryFields.hidden = !isDelivery;
      const inputs = deliveryFields.querySelectorAll('textarea, input');
      inputs.forEach((input) => {
        input.required = isDelivery;
      });
    }

    deliveryRadios.forEach((radio) => radio.addEventListener('change', updateDeliveryState));
    updateDeliveryState();

    const confirmButton = form.querySelector('button[type="button"]');
    confirmButton?.addEventListener('click', () => {
      const nombre = form.querySelector('#nombre')?.value.trim() || '';
      const telefono = form.querySelector('#telefono')?.value.trim() || '';
      const direccion = form.querySelector('#direccion')?.value.trim() || '';
      const entrega = document.querySelector('input[name="entrega"]:checked')?.value || 'A domicilio';

      if (!nombre || !telefono || (entrega === 'A domicilio' && !direccion)) {
        errorBox.textContent = 'Completa los datos requeridos para confirmar tu pedido.';
        return;
      }

      errorBox.textContent = '';
      alert('Pedido confirmado. El negocio se pondrá en contacto contigo para coordinar la entrega.');
      saveCart([]);
      renderCartPage();
      updateCartBadge();
    });
  }

  function initLoginForm() {
    const form = document.getElementById('login-form');
    const errorBox = document.getElementById('login-error');
    const button = form?.querySelector('a.button');

    if (!form || !errorBox || !button) return;

    button.addEventListener('click', (event) => {
      event.preventDefault();
      const usuario = form.querySelector('#usuario')?.value.trim() || '';
      const password = form.querySelector('#password')?.value.trim() || '';

      if (!usuario || !password) {
        errorBox.textContent = 'Ingresa tu usuario y contraseña.';
        return;
      }

      localStorage.setItem(ADMIN_KEY, 'true');
      window.location.href = 'admin/html/index.html';
    });
  }

  document.addEventListener('DOMContentLoaded', () => {
    updateCartBadge();
    initHomePage();
    renderCartPage();
    initCheckoutForm();
    initLoginForm();
  });
})();
