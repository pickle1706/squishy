const DEFAULT_PRODUCTS = [
    {
        id: "p1",
        name: "Squishy Fresa",
        price: 15000,
        description: "Una fresa súper suave y achuchable.",
        category: "COMIDA",
        emoji: "🍓",
        image: ""
    },
    {
        id: "p2",
        name: "Squishy Gatito",
        price: 18000,
        description: "Un gatito adorable para apretar.",
        category: "ANIMALITOS",
        emoji: "🐱",
        image: ""
    },
    {
        id: "p3",
        name: "Squishy Donita",
        price: 16000,
        description: "Una donita suave y súper cute.",
        category: "COMIDA",
        emoji: "🍩",
        image: ""
    }
];

let products = JSON.parse(localStorage.getItem("squiduchProducts")) || DEFAULT_PRODUCTS;
let cart = [];

const productContainer = document.getElementById("productContainer");
const cartButton = document.getElementById("cartButton");
const cartDrawer = document.getElementById("cartDrawer");
const cartOverlay = document.getElementById("cartOverlay");
const closeCart = document.getElementById("closeCart");
const cartItems = document.getElementById("cartItems");
const cartCountElement = document.getElementById("cartCount");
const cartTotalElement = document.getElementById("cartTotal");
const cartMessage = document.getElementById("cartMessage");
const clearCartButton = document.getElementById("clearCart");
const checkoutButton = document.getElementById("checkoutButton");

const adminButton = document.getElementById("adminButton");
const adminPanel = document.getElementById("adminPanel");
const adminOverlay = document.getElementById("adminOverlay");
const closeAdmin = document.getElementById("closeAdmin");
const productForm = document.getElementById("productForm");
const productId = document.getElementById("productId");
const productName = document.getElementById("productName");
const productPrice = document.getElementById("productPrice");
const productDescription = document.getElementById("productDescription");
const productCategory = document.getElementById("productCategory");
const productEmoji = document.getElementById("productEmoji");
const productImage = document.getElementById("productImage");
const saveProduct = document.getElementById("saveProduct");
const cancelEdit = document.getElementById("cancelEdit");
const adminProductList = document.getElementById("adminProductList");
const adminProductCount = document.getElementById("adminProductCount");

const money = value => "$" + Number(value).toLocaleString("es-CO");

function saveProducts() {
    localStorage.setItem("squiduchProducts", JSON.stringify(products));
}

// Función para leer la imagen y convertirla a Base64
function readImage(file) {
    return new Promise((resolve, reject) => {
        if (!file) {
            resolve("");
            return;
        }

        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = () => reject(reader.error);
        reader.readAsDataURL(file);
    });
}

function renderProducts() {
    if (!products.length) {
        productContainer.innerHTML = `
            <div class="no-products">
                <div>🧸</div>
                <h3>No hay productos disponibles</h3>
                <p>El administrador puede agregar nuevos artículos.</p>
            </div>
        `;
        return;
    }

    productContainer.innerHTML = products.map(product => `
        <article class="product-card">
            <div class="product-image ${categoryClass(product.category)}">
                ${
                    product.image
                        ? `<img src="${product.image}" alt="${escapeHTML(product.name)}">`
                        : escapeHTML(product.emoji)
                }
            </div>
            <div class="product-info">
                <span class="product-category">${escapeHTML(product.category)}</span>
                <h3>${escapeHTML(product.name)}</h3>
                <p>${escapeHTML(product.description)}</p>
                <div class="product-bottom">
                    <strong>${money(product.price)}</strong>
                    <button class="add-button" data-id="${product.id}" type="button">+</button>
                </div>
            </div>
        </article>
    `).join("");

    document.querySelectorAll(".add-button").forEach(button => {
        button.addEventListener("click", () => {
            const product = products.find(item => item.id === button.dataset.id);
            if (product) addToCart(product);
        });
    });
}

function categoryClass(category) {
    if (category === "COMIDA") return "pink-product";
    if (category === "ANIMALITOS") return "purple-product";
    return "blue-product";
}

function renderAdminProducts() {
    adminProductCount.textContent = products.length;

    if (!products.length) {
        adminProductList.innerHTML = `<p class="admin-empty">No hay productos registrados.</p>`;
        return;
    }

    adminProductList.innerHTML = products.map(product => `
        <div class="admin-product">
            <div class="admin-product-icon">
                ${
                    product.image 
                        ? `<img src="${product.image}" alt="${escapeHTML(product.name)}" style="width:100%; height:100%; object-fit:cover; border-radius:12px;">`
                        : escapeHTML(product.emoji)
                }
            </div>
            <div class="admin-product-info">
                <strong>${escapeHTML(product.name)}</strong>
                <span>${money(product.price)} · ${escapeHTML(product.category)}</span>
                <small>${escapeHTML(product.description)}</small>
            </div>
            <div class="admin-product-actions">
                <button type="button" class="edit-product" data-id="${product.id}">✏️</button>
                <button type="button" class="delete-product" data-id="${product.id}">🗑️</button>
            </div>
        </div>
    `).join("");

    document.querySelectorAll(".edit-product").forEach(button => {
        button.addEventListener("click", () => editProduct(button.dataset.id));
    });

    document.querySelectorAll(".delete-product").forEach(button => {
        button.addEventListener("click", () => deleteProduct(button.dataset.id));
    });
}

async function addProduct(data) {
    let imageData = "";
    if (data.imageFile) {
        imageData = await readImage(data.imageFile);
    }

    products.push({
        id: "p" + Date.now(),
        name: data.name,
        price: Number(data.price),
        description: data.description,
        category: data.category,
        emoji: data.emoji || "🧸",
        image: imageData
    });

    saveProducts();
    renderProducts();
    renderAdminProducts();
    resetForm();
    showMessage("✅ Producto agregado correctamente");
}

function editProduct(id) {
    const product = products.find(item => item.id === id);
    if (!product) return;

    productId.value = product.id;
    productName.value = product.name;
    productPrice.value = product.price;
    productDescription.value = product.description;
    productCategory.value = product.category;
    productEmoji.value = product.emoji;

    saveProduct.textContent = "Guardar cambios";
    cancelEdit.hidden = false;

    productName.focus();
}

async function updateProduct(id, data) {
    const product = products.find(item => item.id === id);
    if (!product) return;

    // Mantiene la imagen actual si no se sube una nueva
    let imageData = product.image || "";

    if (data.imageFile) {
        imageData = await readImage(data.imageFile);
    }

    product.name = data.name;
    product.price = Number(data.price);
    product.description = data.description;
    product.category = data.category;
    product.emoji = data.emoji || "🧸";
    product.image = imageData;

    saveProducts();
    renderProducts();
    renderAdminProducts();
    resetForm();
    showMessage("✏️ Producto modificado correctamente");
}

function deleteProduct(id) {
    const product = products.find(item => item.id === id);
    if (!product) return;

    const confirmed = confirm(`¿Seguro que deseas eliminar "${product.name}"?`);
    if (!confirmed) return;

    products = products.filter(item => item.id !== id);
    cart = cart.filter(item => item.id !== id);

    saveProducts();
    renderProducts();
    renderAdminProducts();
    renderCart();
    showMessage("🗑️ Producto eliminado");
}

function resetForm() {
    productForm.reset();
    productId.value = "";
    productEmoji.value = "🧸";
    saveProduct.textContent = "Agregar producto";
    cancelEdit.hidden = true;
}

productForm.addEventListener("submit", async event => {
    event.preventDefault();

    const data = {
        name: productName.value.trim(),
        price: productPrice.value,
        description: productDescription.value.trim(),
        category: productCategory.value,
        emoji: productEmoji.value.trim(),
        imageFile: productImage.files[0]
    };

    if (!data.name || !data.price || !data.description) {
        showMessage("⚠️ Completa todos los campos");
        return;
    }

    if (productId.value) {
        await updateProduct(productId.value, data);
    } else {
        await addProduct(data);
    }
});

cancelEdit.addEventListener("click", resetForm);

function openAdmin() {
    adminPanel.classList.add("open");
    adminOverlay.classList.add("show");
    renderAdminProducts();
}

function closeAdminPanel() {
    adminPanel.classList.remove("open");
    adminOverlay.classList.remove("show");
}

adminButton.addEventListener("click", openAdmin);
closeAdmin.addEventListener("click", closeAdminPanel);
adminOverlay.addEventListener("click", closeAdminPanel);

function openCart() {
    cartDrawer.classList.add("open");
    cartOverlay.classList.add("show");
}

function closeCartDrawer() {
    cartDrawer.classList.remove("open");
    cartOverlay.classList.remove("show");
}

cartButton.addEventListener("click", openCart);
closeCart.addEventListener("click", closeCartDrawer);
cartOverlay.addEventListener("click", closeCartDrawer);

function addToCart(product) {
    const existing = cart.find(item => item.id === product.id);

    if (existing) {
        existing.quantity++;
    } else {
        cart.push({ ...product, quantity: 1 });
    }

    renderCart();
    showMessage(`🛒 ${product.name} agregado al carrito`);
}

function changeQuantity(id, amount) {
    const item = cart.find(product => product.id === id);
    if (!item) return;

    item.quantity += amount;

    if (item.quantity <= 0) {
        cart = cart.filter(product => product.id !== id);
    }

    renderCart();
}

function removeItem(id) {
    cart = cart.filter(product => product.id !== id);
    renderCart();
    showMessage("🗑️ Producto eliminado del carrito");
}

function renderCart() {
    const totalProducts = cart.reduce((sum, item) => sum + item.quantity, 0);
    const totalPrice = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);

    cartCountElement.textContent = totalProducts;
    cartTotalElement.textContent = money(totalPrice);
    checkoutButton.disabled = cart.length === 0;

    if (!cart.length) {
        cartItems.innerHTML = `
            <div class="empty-cart">
                <div>🛒</div>
                <h3>Tu carrito está vacío</h3>
                <p>Agrega un squishy para comenzar tu compra.</p>
            </div>
        `;
        return;
    }

    cartItems.innerHTML = cart.map(item => `
        <div class="cart-item">
            <div class="cart-item-icon">
                ${
                    item.image 
                        ? `<img src="${item.image}" alt="${escapeHTML(item.name)}" style="width:100%; height:100%; object-fit:cover; border-radius:12px;">`
                        : escapeHTML(item.emoji)
                }
            </div>
            <div class="cart-item-info">
                <h3>${escapeHTML(item.name)}</h3>
                <span>${money(item.price)} c/u</span>
                <div class="quantity-controls">
                    <button type="button" class="quantity-button" data-action="decrease" data-id="${item.id}">−</button>
                    <strong>${item.quantity}</strong>
                    <button type="button" class="quantity-button" data-action="increase" data-id="${item.id}">+</button>
                </div>
            </div>
            <div class="cart-item-right">
                <strong>${money(item.price * item.quantity)}</strong>
                <button type="button" class="remove-button" data-action="remove" data-id="${item.id}">🗑️</button>
            </div>
        </div>
    `).join("");
}

cartItems.addEventListener("click", event => {
    const button = event.target.closest("button");
    if (!button) return;

    const id = button.dataset.id;
    const action = button.dataset.action;

    if (action === "increase") changeQuantity(id, 1);
    if (action === "decrease") changeQuantity(id, -1);
    if (action === "remove") removeItem(id);
});

clearCartButton.addEventListener("click", () => {
    cart = [];
    renderCart();
    showMessage("🗑️ Carrito vaciado");
});

checkoutButton.addEventListener("click", () => {
    if (!cart.length) return;

    const total = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
    showMessage(`✅ Pedido preparado por ${money(total)}`);
});

document.getElementById("comboButton").addEventListener("click", () => {
    showMessage("🎁 ¡Elige 3 squishies para crear tu combo!");
    document.getElementById("tienda").scrollIntoView({ behavior: "smooth" });
});

document.addEventListener("keydown", event => {
    if (event.key === "Escape") {
        closeCartDrawer();
        closeAdminPanel();
    }
});

function showMessage(text) {
    cartMessage.textContent = text;
    cartMessage.classList.add("show");

    setTimeout(() => cartMessage.classList.remove("show"), 2200);
}

function escapeHTML(value) {
    return String(value)
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
}

renderProducts();
renderAdminProducts();
renderCart();s