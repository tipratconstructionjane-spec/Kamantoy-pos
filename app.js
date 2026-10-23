// --- ร้านข้าวมัน กำนันต้อย สุวรรณภูมิ: ระบบกลาง (app.js) ---

let currentTable = "1";
document.addEventListener('DOMContentLoaded', () => {
    const urlParams = new URLSearchParams(window.location.search);
    const tableParam = urlParams.get('table');
    if (tableParam) {
        currentTable = tableParam;
        localStorage.setItem('kanantoy_table', currentTable);
    } else {
        const savedTable = localStorage.getItem('kanantoy_table');
        if (savedTable) {
            currentTable = savedTable;
        }
    }

    const tableBadge = document.getElementById('table-badge');
    if (tableBadge) {
        tableBadge.innerText = `โต๊ะ: ${currentTable}`;
    }

    loadKitchenOrders();
    setInterval(loadKitchenOrders, 3000);
    updateCartUI();
});

let cart = JSON.parse(localStorage.getItem('cart')) || {};

// 1. ฟังก์ชันเรนเดอร์เมนู
function renderMenuCards(menuItems) {
    const grid = document.getElementById('menu-grid') || 
               document.getElementById('chicken-menu-grid') || 
               document.getElementById('soup-menu-grid') || 
               document.getElementById('noodle-menu-grid') || 
               document.getElementById('water-menu-grid');
    if (!grid) return;

    grid.innerHTML = "";
    menuItems.forEach(item => {
        let qty = cart[item.id] || 0;
        const card = document.createElement("div");
        card.className = "bg-neutral-900 border border-neutral-800 overflow-hidden flex flex-col justify-between shadow-lg rounded-xl";
        card.innerHTML = `
            <div>
                <div class="relative h-32 overflow-hidden bg-neutral-950">
                    <img src="${item.image}" alt="${item.name}" class="w-full h-full object-cover opacity-80 hover:opacity-100 transition" onerror="this.src='https://via.placeholder.com/150?text=No+Image'">
                    <span class="absolute top-2 right-2 bg-red-600 text-white text-[10px] font-black px-2 py-0.5 uppercase tracking-widest">${item.price} ฿</span>
                </div>
                <div class="p-3">
                    <h3 class="font-bold text-sm text-white mb-1 truncate">${item.name}</h3>
                </div>
            </div>
            <div class="p-3 pt-0 flex items-center justify-between">
                <span class="text-[10px] text-neutral-400 uppercase">จำนวน</span>
                <div class="flex items-center space-x-2 bg-neutral-950 border border-neutral-800 px-2 py-1 rounded">
                    <button onclick="updateQty(${item.id}, -1, window.menuItemsList)" class="text-neutral-400 hover:text-white font-mono font-bold px-2">-</button>
                    <span id="qty-${item.id}" class="font-mono text-white text-xs font-bold w-4 text-center">${qty}</span>
                    <button onclick="updateQty(${item.id}, 1, window.menuItemsList)" class="text-neutral-400 hover:text-white font-mono font-bold px-2">+</button>
                </div>
            </div>
        `;
        grid.appendChild(card);
    });
}

function updateQty(itemId, change, menuList) {
    if (!cart[itemId]) cart[itemId] = 0;
    cart[itemId] += change;
    if (cart[itemId] < 0) cart[itemId] = 0;
    localStorage.setItem('cart', JSON.stringify(cart));
    updateCartUI(menuList);
}

function updateCartUI(menuList) {
    let totalPrice = 0;
    let listToUse = menuList || window.menuItemsList || [];
    listToUse.forEach(item => {
        const qtySpan = document.getElementById(`qty-${item.id}`);
        const currentQty = cart[item.id] || 0;
        if (qtySpan) qtySpan.innerText = currentQty;
        if (currentQty > 0) totalPrice += item.price * currentQty;
    });
    const totalElement = document.getElementById('cart-total');
    if (totalElement) totalElement.innerText = `${totalPrice} ฿`;
}

// ฟังก์ชันจัดการปุ่มบริการและขอเช็กบิล (เวอร์ชันเคลียร์ชัด ไม่มียื้อ)
function callService(type) {
    const urlParams = new URLSearchParams(window.location.search);
    const tableNo = urlParams.get('table') || '1';
    let orders = JSON.parse(localStorage.getItem("kanantoy_orders")) || [];

    if (type === 'call_staff') {
        // กรณีเรียกพนักงานธรรมดา
        const serviceOrder = {
            orderId: "SERV-" + Math.floor(1000 + Math.random() * 9000),
            table: tableNo,
            status: "service",
            items: [{ name: "🔔 เรียกพนักงานบริการ", quantity: "1" }],
            timestamp: new Date().toLocaleTimeString()
        };
        orders.unshift(serviceOrder);
        localStorage.setItem("kanantoy_orders", JSON.stringify(orders));
        alert(`🔔 ส่งสัญญาณเรียกพนักงาน โต๊ะ ${tableNo} ไปที่ห้องครัวแล้วครับ!`);

    } else if (type === 'request_bill') {
        // 🔥 บังคับสร้างบิลรายการอาหารและยอดเงินรวมสุทธิทันที ไม่มีหลุดไป SERV!
        let cart = JSON.parse(localStorage.getItem("kanantoy_cart")) || 
                   JSON.parse(localStorage.getItem("cart")) || [];

        let grandTotal = 0;
        let billItems = [];

        if (cart.length > 0) {
            cart.forEach(item => {
                let itemName = item.name || item.title || 'รายการอาหาร';
                let price = Number(item.price) || 60; 
                let quantity = Number(item.quantity) || 1;
                let total = price * quantity;
                grandTotal += total;

                billItems.push({
                    name: `${itemName} (${price}x${quantity})`,
                    quantity: `${total} ฿`
                });
            });
        } else {
            // ยอดสำรองกรณีตะกร้าว่าง
            billItems.push({
                name: "ค่าอาหารและเครื่องดื่มรวมโต๊ะ " + tableNo,
                quantity: "ตรวจสอบที่เคาน์เตอร์"
            });
            grandTotal = 250;
        }

        // เพิ่มบรรทัดสรุปยอดรวมสุทธิทั้งสิ้น
        billItems.push({
            name: "--- ยอดรวมสุทธิทั้งสิ้น ---",
            quantity: `${grandTotal} ฿`
        });

        // สร้างรหัสขึ้นต้นด้วย BILL- เพื่อให้หน้าครัว KDS แสดงเป็นการ์ดสีเหลืองและมีปุ่มปริ้นต์สลิปทันที
        const billOrder = {
            orderId: "BILL-" + Math.floor(1000 + Math.random() * 9000),
            table: tableNo,
            status: "bill",
            items: billItems,
            timestamp: new Date().toLocaleTimeString()
        };

        orders.unshift(billOrder);
        localStorage.setItem("kanantoy_orders", JSON.stringify(orders));

        alert(`🧾 ขอเช็กบิลโต๊ะ ${tableNo} สำเร็จ! ยอดรวมสุทธิ ${grandTotal} บาท ส่งใบเสร็จไปที่หน้าครัวเรียบร้อยครับ`);
    }
}

function submitOrder(menuList) {
    let orderedItems = [];
    let totalPrice = 0;
    let hasItem = false;
    let listToUse = menuList || window.menuItemsList || [];

    listToUse.forEach(item => {
        const qty = cart[item.id] || 0;
        if (qty > 0) {
            hasItem = true;
            let subtotal = item.price * qty;
            totalPrice += subtotal;
            orderedItems.push({ name: item.name, quantity: qty, price: item.price });
        }
    });

    if (!hasItem) {
        alert('⚠️ กรุณาเลือกรายการอาหารก่อนยืนยันออร์เดอร์ครับเพื่อนรัก!');
        return;
    }

    const newOrder = {
        orderId: "ORD-" + Math.floor(1000 + Math.random() * 9000),
        table: currentTable,
        items: orderedItems,
        status: "pending",
        timestamp: new Date().toLocaleTimeString()
    };

    let existingOrders = JSON.parse(localStorage.getItem("kanantoy_orders")) || [];
    existingOrders.push(newOrder);
    localStorage.setItem("kanantoy_orders", JSON.stringify(existingOrders));

    alert(`✅ ส่งออร์เดอร์โต๊ะ ${currentTable} ไปที่ห้องครัวเรียบร้อยแล้วครับ!`);
    cart = {};
    localStorage.removeItem('cart');
    renderMenuCards(listToUse);
    updateCartUI(listToUse);
}

// 2. ฟังก์ชันโหลดครัวแบบปลอดภัย (ไร้โค้ดซ้อนพัง)
function loadKitchenOrders() {
    const container = document.getElementById('kitchen-orders-container');
    if (!container) return;

    let orders = JSON.parse(localStorage.getItem('kanantoy_orders')) || [];
    container.innerHTML = "";

    if (orders.length === 0) {
        container.innerHTML = `
            <div class="col-span-full text-center py-20 text-neutral-500">
                <p class="text-xl font-bold uppercase tracking-wider">📭 ยังไม่มีออร์เดอร์ใหม่ในขณะนี้</p>
                <p class="text-xs mt-1">ออร์เดอร์จากลูกค้าจะแสดงผลที่นี่อัตโนมัติ</p>
            </div>
        `;
        return;
    }

    orders.forEach((order, index) => {
        let isService = order.status === "service";
        let cardBg = isService ? "border-yellow-600/50 bg-yellow-950/10" : "border-neutral-800 bg-neutral-900";
        let headerColor = isService ? "text-yellow-500" : "text-red-500";
        let grandTotal = 0;

        let itemsHtml = "";
        if (order.items && Array.isArray(order.items)) {
            order.items.forEach(i => {
                let subtotal = (i.price || 0) * (typeof i.quantity === 'number' ? i.quantity : 1);
                if (!isService && i.price) grandTotal += subtotal;
                itemsHtml += `
                   <div class="flex justify-between items-center py-2 border-b border-neutral-800">
               <div>
                  <p class="font-medium text-white">${i.name}</p>
                  <p class="text-xs text-neutral-400">
                   จำนวน: <span class="font-mono text-white font-bold">${i.quantity}</span> x ${i.price || 0} บาท
                </p>
            </div>
                 <span class="font-semibold text-white">${(i.price || 0) * i.quantity} บาท</span>
           </div>
       `;

            });
        }

        let totalSection = "";
        if (!isService) {
            totalSection = `
                <div class="bg-neutral-950 border border-neutral-800 p-2.5 rounded-lg mb-3 flex justify-between items-center">
                    <span class="text-xs text-neutral-400 uppercase font-bold tracking-wider">ยอดรวมสุทธิ:</span>
                    <span class="text-base font-mono font-black text-red-500">${grandTotal} บาท</span>
                </div>
            `;
        }

        const card = document.createElement('div');
        card.className = `border rounded-xl p-4 flex flex-col justify-between shadow-xl ${cardBg}`;
        card.innerHTML = `
            <div>
                <div class="flex justify-between items-center mb-3 pb-2 border-b border-neutral-800">
                    <span class="font-black text-lg uppercase tracking-wider ${headerColor}">โต๊ะ: ${order.table || '1'}</span>
                    <span class="text-xs text-neutral-400 font-mono">${order.timestamp || ''}</span>
                </div>
                <div class="space-y-1 mb-4">
                    <span class="text-[10px] text-neutral-500 uppercase tracking-widest block mb-1">รายการสั่งซื้อ (${order.orderId || 'ORD'})</span>
                    ${itemsHtml}
                </div>
            </div>
            <div>
                ${totalSection}
                <div class="pt-3 border-t border-neutral-800 flex justify-between items-center">
                    <span class="text-xs font-mono text-neutral-400">สถานะ: ${isService ? '⚠️ แจ้งบริการ' : '🍳 กำลังทำ'}</span>
                    <button onclick="completeOrder(${index})" class="bg-red-600 hover:bg-red-700 text-white text-xs font-bold px-4 py-2 uppercase tracking-widest transition rounded shadow-lg shadow-red-900/30">
                        ✅ ดำเนินการแล้ว
                    </button>
                </div>
            </div>
        `;
        container.appendChild(card);
    });
}

function completeOrder(index) {
    let orders = JSON.parse(localStorage.getItem('kanantoy_orders')) || [];
    orders.splice(index, 1);
    localStorage.setItem('kanantoy_orders', JSON.stringify(orders));
    loadKitchenOrders();
}
// ฟังก์ชันจัดการปุ่มบริการ (เรียกพนักงาน)
function callService(type) {
    const urlParams = new URLSearchParams(window.location.search);
    const tableNo = urlParams.get('table') || '1';
    let orders = JSON.parse(localStorage.getItem("kanantoy_orders")) || [];

    if (type === 'call_staff') {
        const serviceOrder = {
            orderId: "SERV-" + Math.floor(1000 + Math.random() * 9000),
            table: tableNo,
            status: "service",
            items: [{ name: "🔔 เรียกพนักงานบริการ", quantity: "1" }],
            timestamp: new Date().toLocaleTimeString()
        };
        orders.unshift(serviceOrder);
        localStorage.setItem("kanantoy_orders", JSON.stringify(orders));
        alert(`🔔 ส่งสัญญาณเรียกพนักงาน โต๊ะ ${tableNo} ไปที่ห้องครัวแล้วครับ!`);
    }
}

// ฟังก์ชันขอเช็กบิล: เปิดหน้าต่างสลิป HTML ทันทีแบบเด็ดขาด 100%
function requestBillWithTotal() {
    const urlParams = new URLSearchParams(window.location.search);
    const tableNo = urlParams.get('table') || '1';
    
    // เปิดหน้าต่างสลิปใบเสร็จ bill.html ขนาดพอดีจอ พร้อมส่งเบอร์โต๊ะไป
    window.open(`bill.html?table=${tableNo}`, '_blank', 'width=400,height=650');
}


