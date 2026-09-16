// PRODUITS INITIALES
const defaultProducts = [
    { 
        id: 1, 
        name: "Oversized Hoodie Vintage Black", 
        price: 350, 
        category: "hoodies", 
        images: [
            "https://images.unsplash.com/photo-1556905055-8f358a7a47b2?w=500",
            "https://images.unsplash.com/photo-1509631179647-0177331693ae?w=500"
        ], 
        inStock: true, 
        discount: 0 
    },
    { 
        id: 2, 
        name: "T-Shirt Graphic Heavyweight White", 
        price: 220, 
        category: "tshirts", 
        images: [
            "https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=500"
        ], 
        inStock: true, 
        discount: 0 
    }
];

let products = JSON.parse(localStorage.getItem("lunarae_products")) || defaultProducts;
let cart = [];
let keyBuffer = "";
let uploadedImages = [];
document.addEventListener("DOMContentLoaded", () => {
    saveProducts();
    renderProducts(products);
    
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
});

function saveProducts() {
    localStorage.setItem("lunarae_products", JSON.stringify(products));
}

function getFinalPrice(product) {
    if (product.discount > 0) {
        return Math.round(product.price * (1 - product.discount / 100));
    }
    return product.price;
}

// AFFICHAGE DES PRODUITS
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

        // Vignettes miniatures sous l'image principale
        let thumbnailsHTML = "";
        if (imgList.length > 1) {
            thumbnailsHTML = `<div class="product-thumbnails">`;
            imgList.forEach((imgUrl, index) => {
                thumbnailsHTML += `
                    <img src="${imgUrl}" 
                         class="thumb-img ${index === 0 ? 'active' : ''}" 
                         onclick="changeProductImage(${product.id}, '${imgUrl}', this)" 
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
                    <button class="btn-add-cart" onclick="addToCart(${product.id})" ${isOutOfStock ? 'disabled' : ''}>
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

/* PANIER */
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

// SUPPRIMER UN ARTICLE DU PANIER
function removeFromCart(productId) {
    cart = cart.filter(item => item.id !== productId);
    updateCartUI();
}

// MISE À JOUR DE L'AFFICHAGE DU PANIER
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
                <button class="cart-item-remove" onclick="removeFromCart(${item.id})" title="Supprimer de la commande">
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

/* ADMIN */
function openAdminModal() {
    renderAdminList();
    const modal = document.getElementById("admin-modal");
    if (modal) modal.classList.add("active");
   // Quand le mot "admin" est détecté dans votre code existant :
if (typedKeys === "admin") {
    document.getElementById("admin-pop").style.display = "flex";
    document.getElementById("pass-input").focus();
    typedKeys = "";
}

// Fonction de vérification du mot de passe
function validatePass() {
    const input = document.getElementById("pass-input").value;
    if (input === "1234") { // Votre mot de passe
        window.location.href = "admin.html";
    } else {
        alert("Mot de passe incorrect !");
        document.getElementById("pass-input").value = "";
    }
} 
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
                    <button class="admin-btn-action btn-stock" onclick="toggleStock(${p.id})">
                        ${p.inStock ? 'Mettre en rupture' : 'Remettre en stock'}
                    </button>
                    <button class="admin-btn-action btn-promo" onclick="setPromo(${p.id})">
                        ${p.discount > 0 ? `Promo: -${p.discount}% (Changer)` : 'Ajouter Promo'}
                    </button>
                    <button class="admin-btn-action btn-delete" onclick="deleteProduct(${p.id})">Supprimer</button>
                </div>
            </div>
        `;
    });
}

function handleAddProduct(e) {
    e.preventDefault();
    const name = document.getElementById("admin-name").value.trim();
    const price = parseFloat(document.getElementById("admin-price").value);
    const category = document.getElementById("admin-category").value;

    const query = encodeURIComponent(name);
    const generatedImages = [
        `https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=500`,
        `https://images.unsplash.com/photo-1556905055-8f358a7a47b2?w=500`
    ];

    const newProd = {
        id: Date.now(),
        name,
        price,
        category,
        images: generatedImages,
        inStock: true,
        discount: 0
    };

    products.push(newProd);
    saveProducts();
    renderProducts(products);
    renderAdminList();
    document.getElementById("add-product-form").reset();
}

function toggleStock(id) {
    const p = products.find(prod => prod.id === id);
    if (p) {
        p.inStock = !p.inStock;
        saveProducts();
        renderProducts(products);
        renderAdminList();
    }
}

function setPromo(id) {
    const p = products.find(prod => prod.id === id);
    if (p) {
        const val = prompt("Entrez le pourcentage de réduction (ex: 20 pour 20%):", p.discount || 0);
        if (val !== null) {
            p.discount = Math.min(100, Math.max(0, parseInt(val) || 0));
            saveProducts();
            renderProducts(products);
            renderAdminList();
        }
    }
}

function deleteProduct(id) {
    if (confirm("Voulez-vous vraiment supprimer ce produit ?")) {
        products = products.filter(p => p.id !== id);
        saveProducts();
        renderProducts(products);
        renderAdminList();
    }
}

/* VALIDATION WHATSAPP */
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
// CONVERTIT LES FICHIERS SÉLECTIONNÉS EN APERÇU
function handleFileSelect(e) {
    const files = Array.from(e.target.files);
    const previewContainer = document.getElementById("file-preview-list");
    previewContainer.innerHTML = "";
    uploadedImages = [];

    files.forEach(file => {
        const reader = new FileReader();
        reader.onload = function(event) {
            const imgUrl = event.target.result;
            uploadedImages.push(imgUrl);

            previewContainer.innerHTML += `
                <div class="preview-thumb">
                    <img src="${imgUrl}" alt="Aperçu">
                </div>
            `;
        };
        reader.readAsDataURL(file);
    });
}

// REMPLACEZ VOTRE ANCIENNE FONCTION handleAddProduct PAR CELLE-CI
function handleAddProduct(e) {
    e.preventDefault();
    const name = document.getElementById("admin-name").value.trim();
    const price = parseFloat(document.getElementById("admin-price").value);
    const category = document.getElementById("admin-category").value;

    const finalImages = uploadedImages.length > 0 
        ? uploadedImages 
        : ["https://images.unsplash.com/photo-1523381210434-271e8be1f52b?w=500"];

    const newProd = {
        id: Date.now(),
        name,
        price,
        category,
        images: finalImages,
        inStock: true,
        discount: 0
    };

    products.push(newProd);
    saveProducts();
    renderProducts(products);
    renderAdminList();

    document.getElementById("add-product-form").reset();
    document.getElementById("file-preview-list").innerHTML = "";
    uploadedImages = [];
}
