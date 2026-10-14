/* WAITING KILLS — interactions, motion, demo cart and booking */
document.documentElement.classList.remove("no-js");

document.addEventListener("DOMContentLoaded", () => {
  const yearNodes = document.querySelectorAll("[data-year]");
  yearNodes.forEach(node => node.textContent = new Date().getFullYear());

  // Mobile navigation
  const toggle = document.querySelector(".menu-toggle");
  const nav = document.querySelector(".main-nav");
  if (toggle && nav) {
    const closeNav = () => {
      toggle.setAttribute("aria-expanded", "false");
      toggle.setAttribute("aria-label", "Open navigation");
      nav.classList.remove("is-open");
      document.body.classList.remove("menu-open");
    };
    toggle.addEventListener("click", () => {
      const open = toggle.getAttribute("aria-expanded") !== "true";
      toggle.setAttribute("aria-expanded", String(open));
      toggle.setAttribute("aria-label", open ? "Close navigation" : "Open navigation");
      nav.classList.toggle("is-open", open);
      document.body.classList.toggle("menu-open", open);
    });
    nav.querySelectorAll("a").forEach(link => link.addEventListener("click", closeNav));
    window.addEventListener("resize", () => { if (window.innerWidth > 680) closeNav(); });
  }

  // Reveal content as it enters the viewport; graceful fallback without IntersectionObserver.
  const revealNodes = document.querySelectorAll(".reveal");
  if ("IntersectionObserver" in window) {
    const observer = new IntersectionObserver((entries, obs) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          obs.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12, rootMargin: "0px 0px -35px 0px" });
    revealNodes.forEach(node => observer.observe(node));
  } else {
    revealNodes.forEach(node => node.classList.add("is-visible"));
  }

  // Restrained pointer movement on the main hero image (desktop only).
  const heroVisual = document.querySelector(".hero-visual");
  const heroImage = document.querySelector(".hero-image");
  if (heroVisual && heroImage && window.matchMedia("(hover: hover) and (pointer: fine)").matches) {
    heroVisual.addEventListener("pointermove", event => {
      const rect = heroVisual.getBoundingClientRect();
      const x = (event.clientX - rect.left) / rect.width - 0.5;
      const y = (event.clientY - rect.top) / rect.height - 0.5;
      heroImage.style.transform = `scale(1.055) translate(${x * -10}px, ${y * -10}px)`;
    });
    heroVisual.addEventListener("pointerleave", () => { heroImage.style.transform = ""; });
  }

  // Menu category filters.
  const filterButtons = document.querySelectorAll("[data-filter]");
  const menuItems = document.querySelectorAll(".menu-item[data-category]");
  filterButtons.forEach(button => button.addEventListener("click", () => {
    filterButtons.forEach(item => item.classList.toggle("active", item === button));
    const filter = button.dataset.filter;
    menuItems.forEach(item => {
      const show = filter === "all" || item.dataset.category === filter;
      item.classList.toggle("is-hidden", !show);
      if (show) item.classList.add("is-visible");
    });
  }));

  // Small localStorage-backed demonstration cart. No payment or server request.
  const cartDrawer = document.querySelector("[data-cart-drawer]");
  const cartCountNodes = document.querySelectorAll("[data-cart-count]");
  const cartItemsNode = document.querySelector("[data-cart-items]");
  const cartTotalNode = document.querySelector("[data-cart-total]");
  let cart = [];
  try { cart = JSON.parse(localStorage.getItem("wk-demo-cart") || "[]"); } catch (_) { cart = []; }
  if (!Array.isArray(cart)) cart = [];

  const money = amount => `€${Number(amount).toFixed(2)}`;
  const saveCart = () => {
    try { localStorage.setItem("wk-demo-cart", JSON.stringify(cart)); } catch (_) {}
  };
  const renderCart = () => {
    const count = cart.reduce((sum, item) => sum + item.qty, 0);
    const total = cart.reduce((sum, item) => sum + item.price * item.qty, 0);
    cartCountNodes.forEach(node => node.textContent = count);
    if (cartTotalNode) cartTotalNode.textContent = money(total);
    if (cartItemsNode) {
      if (!cart.length) {
        cartItemsNode.innerHTML = '<p class="cart-empty">Your bag is taking a breather.</p>';
      } else {
        cartItemsNode.innerHTML = cart.map(item => `
          <div class="cart-line">
            <div><strong>${escapeHTML(item.name)}</strong><small>${money(item.price)} each</small></div>
            <div class="cart-line-actions">
              <button type="button" data-qty="-1" data-item="${escapeHTML(item.name)}" aria-label="Remove one ${escapeHTML(item.name)}">−</button>
              <span>${item.qty}</span>
              <button type="button" data-qty="1" data-item="${escapeHTML(item.name)}" aria-label="Add one ${escapeHTML(item.name)}">+</button>
            </div>
          </div>`).join("");
      }
    }
    saveCart();
  };
  const openCart = () => {
    if (!cartDrawer) return;
    cartDrawer.classList.add("is-open");
    cartDrawer.setAttribute("aria-hidden", "false");
    document.body.classList.add("cart-open");
  };
  const closeCart = () => {
    if (!cartDrawer) return;
    cartDrawer.classList.remove("is-open");
    cartDrawer.setAttribute("aria-hidden", "true");
    document.body.classList.remove("cart-open");
  };
  const escapeHTML = value => String(value).replace(/[&<>"']/g, char => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
  }[char]));

  document.querySelectorAll("[data-add]").forEach(button => button.addEventListener("click", () => {
    const name = button.dataset.name;
    const price = Number(button.dataset.price);
    if (!name || !Number.isFinite(price)) return;
    const existing = cart.find(item => item.name === name);
    if (existing) existing.qty += 1;
    else cart.push({ name, price, qty: 1 });
    renderCart();
    const original = button.innerHTML;
    button.innerHTML = 'Added <span>✓</span>';
    window.setTimeout(() => { button.innerHTML = original; }, 1000);
  }));
  document.querySelectorAll("[data-cart-open]").forEach(button => button.addEventListener("click", openCart));
  document.querySelectorAll("[data-cart-close]").forEach(button => button.addEventListener("click", closeCart));
  if (cartItemsNode) cartItemsNode.addEventListener("click", event => {
    const button = event.target.closest("[data-qty]");
    if (!button) return;
    const item = cart.find(entry => entry.name === button.dataset.item);
    if (!item) return;
    item.qty += Number(button.dataset.qty);
    if (item.qty <= 0) cart = cart.filter(entry => entry.name !== item.name);
    renderCart();
  });
  if (cartDrawer) cartDrawer.addEventListener("click", event => {
    if (event.target.classList.contains("cart-backdrop")) closeCart();
  });
  document.addEventListener("keydown", event => { if (event.key === "Escape") closeCart(); });
  const checkout = document.querySelector("[data-checkout]");
  if (checkout) checkout.addEventListener("click", () => {
    alert("Thanks for exploring Waiting Kills! This portfolio demo does not process payments.");
  });
  renderCart();

  // Booking form: client-side demo validation only.
  const bookingForm = document.querySelector("#booking");
  if (bookingForm) {
    const dateInput = bookingForm.querySelector('input[type="date"]');
    if (dateInput) {
      const today = new Date();
      const localToday = new Date(today.getTime() - today.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
      dateInput.min = localToday;
    }
    bookingForm.addEventListener("submit", event => {
      event.preventDefault();
      const message = bookingForm.querySelector(".form-message");
      if (!bookingForm.reportValidity()) return;
      const formData = new FormData(bookingForm);
      const guestName = String(formData.get("name") || "").trim();
      const date = String(formData.get("date") || "");
      const time = String(formData.get("time") || "");
      const guests = String(formData.get("guests") || "1");
      if (message) {
        message.textContent = `Thanks, ${guestName}. Your demo request for ${date} at ${time} for ${guests} guest${guests === "1" ? "" : "s"} is ready. No real booking has been sent.`;
      }
      bookingForm.querySelector(".form-submit").innerHTML = 'Request noted <span>✓</span>';
    });
  }
});
