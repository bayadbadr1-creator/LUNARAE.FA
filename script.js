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

let products = [];
let cart = [];
let keyBuffer = "";
let uploadedImages = [];

// Variables globales pour le carrousel de la pop-up
let currentImageIndex = 0;
let currentProductImages = [];

// Écouteur Firebase pour récupérer les produits
productsRef.on('value', (snapshot) => {
    const data = snapshot.val();
    products = [];
    if (data) {
        Object.keys(data).forEach(key => {
            products.push({
                id: key,
                ...data[key]
            });
        });
    }
    renderProducts(products);
    renderAdminList();
});

// Détection de l'accès Admin secret (saisie clavier "admin")
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
// 2. AFFICHAGE DES PRODUITS & DÉTAILS
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

        container.innerHTML += `
            <div class="product-card ${isOutOfStock ? 'out-of-stock' : ''}">
                ${isOutOfStock ? '<span class="badge-stock">RUPTURE DE STOCK</span>' : ''}
                ${product.discount > 0 ? `<span class="badge-promo">-${product.discount}%</span>` : ''}
                
                <img src="${mainImg}" class="product-img" alt="${product.name}" onclick="openProductDetailModal('${product.id}')">

                <div class="product-info">
                    <div onclick="openProductDetailModal('${product.id}')" style="cursor: pointer;">
                        <h3 class="product-title">${product.name}</h3>
                        <div class="product-price">
                            ${product.discount > 0 ? `<span class="old-price">${product.price} DH</span>` : ''}
                            ${finalPrice} DH
                        </div>
                    </div>
                    <button class="btn-add-cart" onclick="openProductDetailModal('${product.id}')">
                        Voir les détails
                    </button>
                </div>
            </div>
        `;
    });
}

function openProductDetailModal(productId) {
    const product = products.find(p => p.id === productId);
    if (!product) return;

    const finalPrice = getFinalPrice(product);
    currentProductImages = product.images && product.images.length > 0 
        ? product.images 
        : [product.img || "https://images.unsplash.com/photo-1523381210434-271e8be1f52b?w=500"];

    currentImageIndex = 0;

    const sizes = product.sizes ? product.sizes.split(',').map(s => s.trim()) : [];
    const colors = product.colors ? product.colors.split(',').map(c => c.trim()) : [];

    let sizesHTML = sizes.length > 0 ? `
        <div class="option-group">
            <label>Taille :</label>
            <div class="option-buttons" id="detail-sizes">
                ${sizes.map((s, i) => `<button class="option-btn ${i === 0 ? 'active' : ''}" onclick="selectOption(this)">${s}</button>`).join('')}
            </div>
        </div>
    ` : '';

    let colorsHTML = colors.length > 0 ? `
        <div class="option-group">
            <label>Couleur :</label>
            <div class="option-buttons" id="detail-colors">
                ${colors.map((c, i) => `<button class="option-btn ${i === 0 ? 'active' : ''}" onclick="selectOption(this)">${c}</button>`).join('')}
            </div>
        </div>
    ` : '';

    let thumbsHTML = currentProductImages.length > 1 ? `
        <div class="detail-thumbs">
            ${currentProductImages.map((img, i) => `<img src="${img}" class="thumb-img ${i === 0 ? 'active' : ''}" onclick="setDetailImageByIndex(${i})">`).join('')}
        </div>
    ` : '';

    const detailBody = document.getElementById("product-detail-body");
    detailBody.innerHTML = `
        <div class="detail-grid">
            <div class="detail-images-wrapper">
                <div class="detail-img-slider" id="detail-slider">
                    <img src="${currentProductImages[0]}" id="detail-main-img" class="detail-main-img" draggable="false">
                </div>
                ${thumbsHTML}
            </div>
            <div class="detail-info">
                <h2>${product.name}</h2>
                <div class="product-price">
                    ${product.discount > 0 ? `<span class="old-price">${product.price} DH</span>` : ''}
                    ${finalPrice} DH
                </div>
                <p class="detail-desc">${product.description || "Aucune description disponible."}</p>
                
                ${sizesHTML}
                ${colorsHTML}

                <button class="btn-add-cart" style="margin-top: 15px;" onclick="addToCartWithOptions('${product.id}')" ${!product.inStock ? 'disabled' : ''}>
                    ${!product.inStock ? 'Épuisé' : 'Ajouter au panier'}
                </button>
            </div>
        </div>
    `;

    document.getElementById("product-detail-modal").classList.add("active");
    document.body.classList.add("modal-open"); // Bloque le scroll arrière-plan

    initImageSwipe();
}

function closeProductDetailModal() {
    const modal = document.getElementById("product-detail-modal");
    if (modal) {
        modal.classList.remove("active");
        document.body.classList.remove("modal-open"); // Débloque le scroll
    }
}

function setDetailImageByIndex(index) {
    if (index < 0) index = currentProductImages.length - 1;
    if (index >= currentProductImages.length) index = 0;
    
    currentImageIndex = index;
    const mainImg = document.getElementById("detail-main-img");
    if (mainImg) mainImg.src = currentProductImages[currentImageIndex];

    const thumbs = document.querySelectorAll(".detail-thumbs .thumb-img");
    thumbs.forEach((t, i) => {
        if (i === currentImageIndex) t.classList.add("active");
        else t.classList.remove("active");
    });
}

function selectOption(btn) {
    btn.parentElement.querySelectorAll('.option-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
}

function addToCartWithOptions(productId) {
    const product = products.find(p => p.id === productId);
    if (!product || !product.inStock) return;

    const selectedSizeBtn = document.querySelector("#detail-sizes .option-btn.active");
    const selectedColorBtn = document.querySelector("#detail-colors .option-btn.active");

    const size = selectedSizeBtn ? selectedSizeBtn.textContent : null;
    const color = selectedColorBtn ? selectedColorBtn.textContent : null;

    const mainImg = (product.images && product.images[0]) || product.img;

    const cartItemId = `${productId}-${size || ''}-${color || ''}`;
    const existing = cart.find(i => i.cartItemId === cartItemId);

    if (existing) {
        existing.qty += 1;
    } else {
        cart.push({
            ...product,
            cartItemId,
            selectedSize: size,
            selectedColor: color,
            img: mainImg,
            qty: 1,
            finalPrice: getFinalPrice(product)
        });
    }

    closeProductDetailModal();
    updateCartUI();
    openCartModal();
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

// Navigation Clavier (Flèches Gauche / Droite)
document.addEventListener("keydown", (e) => {
    const modal = document.getElementById("product-detail-modal");
    if (!modal || !modal.classList.contains("active")) return;

    if (e.key === "ArrowRight") {
        setDetailImageByIndex(currentImageIndex + 1);
    } else if (e.key === "ArrowLeft") {
        setDetailImageByIndex(currentImageIndex - 1);
    }
});

// Navigation Glissement Tactile (Mobile)
function initImageSwipe() {
    const slider = document.getElementById("detail-slider");
    if (!slider) return;

    let startX = 0;

    slider.addEventListener("touchstart", (e) => {
        startX = e.touches[0].clientX;
    });

    slider.addEventListener("touchend", (e) => {
        const endX = e.changedTouches[0].clientX;
        const diffX = endX - startX;
        if (diffX < -40) setDetailImageByIndex(currentImageIndex + 1);
        if (diffX > 40) setDetailImageByIndex(currentImageIndex - 1);
    });
}

// ==========================================
// 3. PANIER & COMMANDE
// ==========================================
function removeFromCart(cartItemId) {
    cart = cart.filter(item => item.cartItemId !== cartItemId);
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
        let optionsText = [];
        if (item.selectedSize) optionsText.push(`Taille: ${item.selectedSize}`);
        if (item.selectedColor) optionsText.push(`Couleur: ${item.selectedColor}`);
        const optsString = optionsText.length > 0 ? `<br><small style="color:#666">${optionsText.join(' | ')}</small>` : '';

        cartContainer.innerHTML += `
            <div class="cart-item">
                <img src="${item.img}" alt="${item.name}">
                <div class="cart-item-info">
                    <div class="cart-item-title">${item.name}${optsString}</div>
                    <div class="cart-item-price">${item.finalPrice} DH (x${item.qty})</div>
                </div>
                <button class="cart-item-remove" onclick="removeFromCart('${item.cartItemId}')">&times;</button>
            </div>
        `;
    });
}

function openCartModal() {
    document.getElementById("cart-modal").classList.add("active");
    document.body.classList.add("modal-open");
}

function closeCartModal() {
    document.getElementById("cart-modal").classList.remove("active");
    document.body.classList.remove("modal-open");
}

// ==========================================
// 4. ADMIN & FIREBASE
// ==========================================
function openAdminModal() {
    renderAdminList();
    document.getElementById("admin-modal").classList.add("active");
    document.body.classList.add("modal-open");
}

function closeAdminModal() {
    document.getElementById("admin-modal").classList.remove("active");
    document.body.classList.remove("modal-open");
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
                        ${p.discount > 0 ? `Promo: -${p.discount}%` : 'Ajouter Promo'}
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
                previewContainer.innerHTML += `<div class="preview-thumb"><img src="${imgUrl}"></div>`;
            }
        };
        reader.readAsDataURL(file);
    });
}

function handleAddProduct(e) {
    e.preventDefault();
    const name = document.getElementById("admin-name").value.trim();
    const price = parseFloat(document.getElementById("admin-price").value);
    const category = document.getElementById("admin-category").value;
    const sizes = document.getElementById("admin-sizes").value.trim();
    const colors = document.getElementById("admin-colors").value.trim();
    const description = document.getElementById("admin-description").value.trim();

    const finalImages = uploadedImages.length > 0 
        ? uploadedImages 
        : ["https://images.unsplash.com/photo-1523381210434-271e8be1f52b?w=500"];

    productsRef.push({
        name,
        price,
        category,
        sizes,
        colors,
        description,
        images: finalImages,
        inStock: true,
        discount: 0
    }).then(() => {
        document.getElementById("add-product-form").reset();
        document.getElementById("file-preview-list").innerHTML = "";
        uploadedImages = [];
    }).catch(err => alert("Erreur : " + err.message));
}

function toggleStock(id) {
    const p = products.find(prod => prod.id === id);
    if (p) database.ref('products/' + id).update({ inStock: !p.inStock });
}

function setPromo(id) {
    const p = products.find(prod => prod.id === id);
    if (p) {
        const val = prompt("Pourcentage de réduction:", p.discount || 0);
        if (val !== null) {
            database.ref('products/' + id).update({ discount: Math.min(100, Math.max(0, parseInt(val) || 0)) });
        }
    }
}

function deleteProduct(id) {
    if (confirm("Supprimer ce produit ?")) database.ref('products/' + id).remove();
}

// ==========================================
// 5. ENVOI WHATSAPP & FERMETURE EXTERIEURE
// ==========================================
function validatePhoneInput(input) { input.value = input.value.replace(/[^0-9]/g, ''); }

function clearError(inputId) {
    const input = document.getElementById(inputId);
    const errorMsg = document.getElementById(`error-${inputId}`);
    if (input) input.classList.remove('input-error');
    if (errorMsg) { errorMsg.classList.remove('active'); errorMsg.textContent = ''; }
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

    if (cart.length === 0) return;

    if (!name) { showError("client-name", "Entrez votre nom."); hasError = true; }
    if (!phone || !/^[0-9]{10}$/.test(phone)) { showError("client-phone", "Numéro valide requis (10 chiffres)."); hasError = true; }
    if (!city) { showError("client-city", "Indiquez votre ville."); hasError = true; }

    if (hasError) return;

    let orderList = "";
    let total = 0;
    cart.forEach(item => {
        let details = [];
        if (item.selectedSize) details.push(`Taille: ${item.selectedSize}`);
        if (item.selectedColor) details.push(`Couleur: ${item.selectedColor}`);
        const detailsStr = details.length > 0 ? ` (${details.join(', ')})` : '';

        orderList += `• ${item.name}${detailsStr} (x${item.qty}) - ${item.finalPrice * item.qty} DH\n`;
        total += item.finalPrice * item.qty;
    });

    const msg = `*COMMANDE LUNARAE.ma*\n\nNom: ${name}\nTél: ${phone}\nVille: ${city}\n\nArticles:\n${orderList}\nTotal: ${total} DH`;
    window.open(`https://wa.me/212705948052?text=${encodeURIComponent(msg)}`, "_blank");
}

// Fermeture des pop-ups lors d'un clic en dehors de la fenêtre
window.addEventListener("click", (event) => {
    const detailModal = document.getElementById("product-detail-modal");
    const cartModal = document.getElementById("cart-modal");
    const adminModal = document.getElementById("admin-modal");

    if (event.target === detailModal) closeProductDetailModal();
    if (event.target === cartModal) closeCartModal();
    if (event.target === adminModal) closeAdminModal();
});