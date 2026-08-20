let products = [];
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

// Cargar productos desde la API de Django
async function fetchProducts() {
    try {
        const response = await fetch('http://127.0.0.1:8000/api/productos/');
        if (response.ok) {
            const data = await response.json();
            // Adaptamos los campos del backend (español) al frontend
            products = data.map(item => ({
                id: item.id_producto || item.id,
                name: item.nombre,
                price: Number(item.precio),
                description: item.descripcion,
                category: item.categoria,
                emoji: item.emoji || "🧸",
                image: item.imagen || "",
                stock: item.stock || 10
            }));
            renderProducts();
            renderAdminProducts();
        }
    } catch (error) {
        console.error("Error al conectar con la API de Django:", error);
    }
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
            const product = products.find(item => String(item.id) === String(button.dataset.id));
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

    const payload = {
        nombre: data.name,
        precio: data.price,
        descripcion: data.description,
        categoria: data.category,
        stock: 10,
        imagen: imageData
    };

    try {
        const response = await fetch('http://127.0.0.1:8000/api/productos/', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        if (response.ok) {
            await fetchProducts(); // Recarga la lista desde Django
            resetForm();
            showMessage("✅ Producto guardado en la base de datos");
        } else {
            showMessage("⚠️ Error al guardar en el servidor");
        }
    } catch (error) {
        console.error("Error:", error);
    }
}

function editProduct(id) {
    const product = products.find(item => String(item.id) === String(id));
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
    let imageData = "";
    if (data.imageFile) {
        imageData = await readImage(data.imageFile);
    } else {
        const existing = products.find(item => String(item.id) === String(id));
        if (existing) imageData = existing.image;
    }

    const payload = {
        nombre: data.name,
        precio: data.price,
        descripcion: data.description,
        categoria: data.category,
        stock: 10,
        imagen: imageData
    };

    try {
        const response = await fetch(`http://127.0.0.1:8000/api/productos/${id}/`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        if (response.ok) {
            await fetchProducts();
            resetForm();
            showMessage("✏️ Producto modificado correctamente");
        } else {
            showMessage("⚠️ Error al actualizar");
        }
    } catch (error) {
        console.error("Error al actualizar:", error);
    }
}

async function deleteProduct(id) {
    const product = products.find(item => String(item.id) === String(id));
    if (!product) return;

    const confirmed = confirm(`¿Seguro que deseas eliminar "${product.name}"?`);
    if (!confirmed) return;

    try {
        const response = await fetch(`http://127.0.0.1:8000/api/productos/${id}/`, {
            method: 'DELETE',
        });

        if (response.ok || response.status === 204) {
            products = products.filter(item => String(item.id) !== String(id));
            cart = cart.filter(item => String(item.id) !== String(id));
            renderProducts();
            renderAdminProducts();
            renderCart();
            showMessage("🗑️ Producto eliminado de la base de datos");
        }
    } catch (error) {
        console.error("Error al eliminar:", error);
    }
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
    const existing = cart.find(item => String(item.id) === String(product.id));

    if (existing) {
        existing.quantity++;
    } else {
        cart.push({ ...product, quantity: 1 });
    }

    renderCart();
    showMessage(`🛒 ${product.name} agregado al carrito`);
}

function changeQuantity(id, amount) {
    const item = cart.find(product => String(product.id) === String(id));
    if (!item) return;

    item.quantity += amount;

    if (item.quantity <= 0) {
        cart = cart.filter(product => String(product.id) !== String(id));
    }

    renderCart();
}

function removeItem(id) {
    cart = cart.filter(product => String(product.id) !== String(id));
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

// Inicializar cargando desde la API de Django
fetchProducts();
renderCart();