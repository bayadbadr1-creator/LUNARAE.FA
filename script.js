// ==========================================
// 1. CONFIGURATION & INITIALISATION FIREBASE
// ==========================================
const firebaseConfig = {
    apiKey: "AIzaSyD_x1qY8E7UWc8VYHQ8K6pUXe_q3_PqCEo",
    authDomain: "lunarae-8acff.firebaseapp.com",
    databaseURL: "https://lunarae-8acff-default-rtdb.firebaseio.com",
    projectId: "lunarae-8acff",
    storageBucket: "lunarae-8acff.firebasestorage.app",
    messagingSenderId: "533518294314",
    appId: "1:533518294314:web:b5bc13455d69d11a4dd253"
};

firebase.initializeApp(firebaseConfig);
const database = firebase.database();
const productsRef = database.ref('products');

// Variables globales
let products = [];
let cart = [];
let keyBuffer = "";
let uploadedImages = [];

    productsRef.on('value', (snapshot) => {
        const data = snapshot.val();
        products = [];
        if (data) {
            Object.keys(data).forEach(key => {
                products.push({
                    id: key, // Clé unique Firebase
                    ...data[key]
                });
            });
        }
        renderProducts(products);
        renderAdminList();
    });
    
    // Détection clavier du mot 'admin'
    document.addEventListener("keydown", (e) => {
        if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
        keyBuffer += e.key.toLowerCase();
        if (keyBuffer.length > 10) keyBuffer = keyBuffer.substring(keyBuffer.length - 10);
        
        if (keyBuffer.endsWith("admin")) {
            const ghostBtn = document.getElementById("ghost-admin-btn");
            if (ghostBtn) {
                ghostBtn.classList.add("visible");
                openAdminModal();
            }
        }
    });

function getFinalPrice(product) {
    if (product.discount > 0) {
        return Math.round(product.price * (1 - product.discount / 100));
    }
    return product.price;
}

// ==========================================
// 3. AFFICHAGE DES PRODUITS (CLIENT)
// ==========================================
function renderProducts(items) {
    const container = document.getElementById("product-container");
    if (!container) return;
    
    container.innerHTML = "";
    items.forEach(product => {
        const finalPrice = getFinalPrice(product);
        const isOutOfStock = !product.inStock;
        
        const imgList = product.images && product.images.length > 0 
            ? product.images 
            : [product.img || "https://images.unsplash.com/photo-1523381210434-271e8be1f52b?w=500"];
            
        const mainImg = imgList[0];

        let thumbnailsHTML = "";
        if (imgList.length > 1) {
            thumbnailsHTML = `<div class="product-thumbnails">`;
            imgList.forEach((imgUrl, index) => {
                thumbnailsHTML += `
                    <img src="${imgUrl}" 
                         class="thumb-img ${index === 0 ? 'active' : ''}" 
                         onclick="changeProductImage('${product.id}', '${imgUrl}', this)" 
                         alt="Aperçu">
                `;
            });
            thumbnailsHTML += `</div>`;
        }

        container.innerHTML += `
            <div class="product-card ${isOutOfStock ? 'out-of-stock' : ''}">
                ${isOutOfStock ? '<span class="badge-stock">RUPTURE DE STOCK</span>' : ''}
                ${product.discount > 0 ? `<span class="badge-promo">-${product.discount}%</span>` : ''}
                
                <img src="${mainImg}" id="main-img-${product.id}" class="product-img" alt="${product.name}">
                
                ${thumbnailsHTML}

                <div class="product-info">
                    <div>
                        <h3 class="product-title">${product.name}</h3>
                        <div class="product-price">
                            ${product.discount > 0 ? `<span class="old-price">${product.price} DH</span>` : ''}
                            ${finalPrice} DH
                        </div>
                    </div>
                    <button class="btn-add-cart" onclick="addToCart('${product.id}')" ${isOutOfStock ? 'disabled' : ''}>
                        <svg class="svg-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-2z"></path><line x1="3" y1="6" x2="21" y2="6"></line><path d="M16 10a4 4 0 0 1-8 0"></path></svg>
                        ${isOutOfStock ? 'Épuisé' : 'Ajouter au panier'}
                    </button>
                </div>
            </div>
        `;
    });
}

function changeProductImage(productId, newSrc, thumbElement) {
    const mainImg = document.getElementById(`main-img-${productId}`);
    if (mainImg) mainImg.src = newSrc;

    const parent = thumbElement.parentElement;
    parent.querySelectorAll('.thumb-img').forEach(img => img.classList.remove('active'));
    thumbElement.classList.add('active');
}

function filterProducts(category, btn) {
    document.querySelectorAll(".filter-btn").forEach(b => b.classList.remove("active"));
    if (btn) btn.classList.add("active");

    if (category === "all") {
        renderProducts(products);
    } else {
        renderProducts(products.filter(p => p.category === category));
    }
}

// ==========================================
// 4. PANIER
// ==========================================
function addToCart(productId) {
    const product = products.find(p => p.id === productId);
    if (!product || !product.inStock) return;

    const mainImg = (product.images && product.images[0]) || product.img;

    const item = cart.find(i => i.id === productId);
    if (item) {
        item.qty += 1;
    } else {
        cart.push({ ...product, img: mainImg, qty: 1, finalPrice: getFinalPrice(product) });
    }
    updateCartUI();
    openCartModal();
}

function removeFromCart(productId) {
    cart = cart.filter(item => item.id !== productId);
    updateCartUI();
}

function updateCartUI() {
    const cartContainer = document.getElementById("cart-items-container");
    const countSpan = document.getElementById("cart-count");
    const subtotalSpan = document.getElementById("cart-subtotal");
    const totalSpan = document.getElementById("cart-total-price");

    const totalQty = cart.reduce((acc, item) => acc + item.qty, 0);
    const totalPrice = cart.reduce((acc, item) => acc + (item.finalPrice * item.qty), 0);

    if (countSpan) countSpan.textContent = totalQty;
    if (subtotalSpan) subtotalSpan.textContent = `${totalPrice} DH`;
    if (totalSpan) totalSpan.textContent = `${totalPrice} DH`;

    if (!cartContainer) return;

    if (cart.length === 0) {
        cartContainer.innerHTML = `<p class="empty-cart-msg">Votre panier est vide.</p>`;
        return;
    }

    cartContainer.innerHTML = "";
    cart.forEach(item => {
        cartContainer.innerHTML += `
            <div class="cart-item">
                <img src="${item.img}" alt="${item.name}">
                <div class="cart-item-info">
                    <div class="cart-item-title">${item.name}</div>
                    <div class="cart-item-price">${item.finalPrice} DH (x${item.qty})</div>
                </div>
                <button class="cart-item-remove" onclick="removeFromCart('${item.id}')" title="Supprimer de la commande">
                    &times;
                </button>
            </div>
        `;
    });
}

function openCartModal() {
    const modal = document.getElementById("cart-modal");
    if (modal) modal.classList.add("active");
}

function closeCartModal() {
    const modal = document.getElementById("cart-modal");
    if (modal) modal.classList.remove("active");
}

// ==========================================
// 5. PANNEAU ADMIN & GESTION FIREBASE
// ==========================================
function openAdminModal() {
    renderAdminList();
    const modal = document.getElementById("admin-modal");
    if (modal) modal.classList.add("active");
}

function closeAdminModal() {
    const modal = document.getElementById("admin-modal");
    if (modal) modal.classList.remove("active");
}

function renderAdminList() {
    const container = document.getElementById("admin-product-list");
    if (!container) return;
    
    container.innerHTML = "";
    products.forEach(p => {
        container.innerHTML += `
            <div class="admin-item">
                <div class="admin-item-header">
                    <span>${p.name} (${p.price} DH)</span>
                    <small>${p.category}</small>
                </div>
                <div class="admin-actions">
                    <button class="admin-btn-action btn-stock" onclick="toggleStock('${p.id}')">
                        ${p.inStock ? 'Mettre en rupture' : 'Remettre en stock'}
                    </button>
                    <button class="admin-btn-action btn-promo" onclick="setPromo('${p.id}')">
                        ${p.discount > 0 ? `Promo: -${p.discount}% (Changer)` : 'Ajouter Promo'}
                    </button>
                    <button class="admin-btn-action btn-delete" onclick="deleteProduct('${p.id}')">Supprimer</button>
                </div>
            </div>
        `;
    });
}

function handleFileSelect(e) {
    const files = Array.from(e.target.files);
    const previewContainer = document.getElementById("file-preview-list");
    if (previewContainer) previewContainer.innerHTML = "";
    uploadedImages = [];

    files.forEach(file => {
        const reader = new FileReader();
        reader.onload = function(event) {
            const imgUrl = event.target.result;
            uploadedImages.push(imgUrl);

            if (previewContainer) {
                previewContainer.innerHTML += `
                    <div class="preview-thumb">
                        <img src="${imgUrl}" alt="Aperçu">
                    </div>
                `;
            }
        };
        reader.readAsDataURL(file);
    });
}

// AJOUT DE PRODUIT DANS FIREBASE
function handleAddProduct(e) {
    e.preventDefault();
    const name = document.getElementById("admin-name").value.trim();
    const price = parseFloat(document.getElementById("admin-price").value);
    const category = document.getElementById("admin-category").value;

    const finalImages = uploadedImages.length > 0 
        ? uploadedImages 
        : ["https://images.unsplash.com/photo-1523381210434-271e8be1f52b?w=500"];

    // Sauvegarde en ligne sur Firebase
    productsRef.push({
        name: name,
        price: price,
        category: category,
        images: finalImages,
        inStock: true,
        discount: 0
    }).then(() => {
        document.getElementById("add-product-form").reset();
        const previewContainer = document.getElementById("file-preview-list");
        if (previewContainer) previewContainer.innerHTML = "";
        uploadedImages = [];
    }).catch(err => {
        alert("Erreur lors de l'ajout : " + err.message);
    });
}

// CHANGER LE STOCK DANS FIREBASE
function toggleStock(id) {
    const p = products.find(prod => prod.id === id);
    if (p) {
        database.ref('products/' + id).update({
            inStock: !p.inStock
        });
    }
}

// METTRE UNE PROMO DANS FIREBASE
function setPromo(id) {
    const p = products.find(prod => prod.id === id);
    if (p) {
        const val = prompt("Entrez le pourcentage de réduction (ex: 20 pour 20%):", p.discount || 0);
        if (val !== null) {
            const newDiscount = Math.min(100, Math.max(0, parseInt(val) || 0));
            database.ref('products/' + id).update({
                discount: newDiscount
            });
        }
    }
}

// SUPPRIMER UN PRODUIT DE FIREBASE
function deleteProduct(id) {
    if (confirm("Voulez-vous vraiment supprimer ce produit ?")) {
        database.ref('products/' + id).remove();
    }
}

// ==========================================
// 6. VALIDATION & ENVOI WHATSAPP
// ==========================================
function validatePhoneInput(input) { input.value = input.value.replace(/[^0-9]/g, ''); }

function clearError(inputId) {
    const input = document.getElementById(inputId);
    const errorMsg = document.getElementById(`error-${inputId}`);
    if (input) input.classList.remove('input-error');
    if (errorMsg) { errorMsg.classList.remove('active'); errorMsg.textContent = ''; }
    const globalError = document.getElementById('cart-global-error');
    if (globalError) globalError.style.display = 'none';
}

function showError(inputId, message) {
    const input = document.getElementById(inputId);
    const errorMsg = document.getElementById(`error-${inputId}`);
    if (input) input.classList.add('input-error');
    if (errorMsg) { errorMsg.textContent = message; errorMsg.classList.add('active'); }
}

function sendOrderToWhatsApp() {
    let hasError = false;
    const name = document.getElementById("client-name").value.trim();
    const phone = document.getElementById("client-phone").value.trim();
    const city = document.getElementById("client-city").value.trim();
    const globalError = document.getElementById("cart-global-error");

    if (cart.length === 0) {
        if (globalError) { globalError.textContent = "Votre panier est vide !"; globalError.style.display = "block"; }
        return;
    }

    if (!name) { showError("client-name", "Veuillez entrer votre nom complet."); hasError = true; }

    const phoneRegex = /^[0-9]{10}$/;
    if (!phone) { showError("client-phone", "Veuillez entrer votre numéro."); hasError = true; }
    else if (!phoneRegex.test(phone)) { showError("client-phone", "Le numéro doit contenir exactement 10 chiffres."); hasError = true; }

    if (!city) { showError("client-city", "Veuillez indiquer votre ville."); hasError = true; }

    if (hasError) return;

    let orderList = "";
    let total = 0;
    cart.forEach(item => {
        orderList += `• ${item.name} (x${item.qty}) - ${item.finalPrice * item.qty} DH\n`;
        total += item.finalPrice * item.qty;
    });

    const msg = `*COMMANDE LUNARAE.ma*\n\nNom: ${name}\nTél: ${phone}\nVille: ${city}\n\nArticles:\n${orderList}\nTotal: ${total} DH`;
    window.open(`https://wa.me/212705948052?text=${encodeURIComponent(msg)}`, "_blank");
}