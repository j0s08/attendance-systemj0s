// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getFirestore, doc, setDoc, getDoc, collection, addDoc, getDocs, writeBatch, query } from "firebase/firestore";
import { getAnalytics } from "firebase/analytics";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyBVAYfTy3wWhVkBObXu86zqwGKXUVh8194",
  authDomain: "attendancesystem2025-fa319.firebaseapp.com",
  projectId: "attendancesystem2025-fa319",
  storageBucket: "attendancesystem2025-fa319.firebasestorage.app",
  messagingSenderId: "458232564864",
  appId: "1:458232564864:web:dbab693f9d93e6469a2a65"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const db = getFirestore(app);

// الإعدادات الافتراضية
let settings = {
    startHour: 9,
    endHour: 17,
    workshopLat: 26.09809958663478,
    workshopLng: 44.00278934722962,
    radius: 500,
    locationRestriction: true
};

// تحميل الإعدادات
async function loadSettings() {
    const docSnap = await getDoc(doc(db, 'settings', 'main'));
    if (docSnap.exists()) {
        settings = docSnap.data();
    }
    updateUI();
}

function updateUI() {
    document.getElementById('startHour').value = settings.startHour;
    document.getElementById('endHour').value = settings.endHour;
    document.getElementById('workshopLat').value = settings.workshopLat;
    document.getElementById('workshopLng').value = settings.workshopLng;
    document.getElementById('radius').value = settings.radius;
    updateLocationMessage();
}

// حفظ الإعدادات
async function saveSettings() {
    settings.startHour = parseInt(document.getElementById('startHour').value);
    settings.endHour = parseInt(document.getElementById('endHour').value);
    settings.workshopLat = parseFloat(document.getElementById('workshopLat').value);
    settings.workshopLng = parseFloat(document.getElementById('workshopLng').value);
    settings.radius = parseInt(document.getElementById('radius').value);
    await setDoc(doc(db, 'settings', 'main'), settings);
    alert('تم حفظ الإعدادات!');
}

// نموذج التسجيل
document.getElementById('attendanceForm').addEventListener('submit', async function(e) {
    e.preventDefault();
    
    const name = document.getElementById('name').value;
    const phone = document.getElementById('phone').value;
    const email = document.getElementById('email').value;
    const now = new Date();
    const hour = now.getHours();
    
    if (hour < settings.startHour || hour >= settings.endHour) {
        document.getElementById('message').textContent = `الحضور متاح فقط من ${settings.startHour} إلى ${settings.endHour}.`;
        return;
    }
    
    // تحقق من تكرار الحضور
    if (await isAlreadyCheckedIn(phone, now.toLocaleDateString('en-US'))) {
        document.getElementById('message').textContent = 'لقد سجلت حضورك بالفعل اليوم.';
        document.getElementById('message').style.color = 'red';
        return;
    }
    
    if (navigator.geolocation && settings.locationRestriction) {
        navigator.geolocation.getCurrentPosition(async function(position) {
            const userLat = position.coords.latitude;
            const userLng = position.coords.longitude;
            
            const distance = getDistance(userLat, userLng, settings.workshopLat, settings.workshopLng);
            if (distance > settings.radius) {
                document.getElementById('message').textContent = 'أنت خارج موقع الورشة. الحضور غير متاح.';
                return;
            }
            
            const record = {
                name: name,
                phone: phone,
                email: email,
                date: now.toLocaleDateString('en-US'),
                time: now.toLocaleTimeString('en-US')
            };
            
            await saveRecord(record);
            document.getElementById('message').textContent = 'تم تسجيل حضورك بنجاح!';
            document.getElementById('message').style.color = 'green';
            
        }, function() {
            document.getElementById('message').textContent = 'يرجى السماح بالوصول إلى الموقع.';
        });
    } else {
        const record = {
            name: name,
            phone: phone,
            email: email,
            date: now.toLocaleDateString('en-US'),
            time: now.toLocaleTimeString('en-US')
        };
        await saveRecord(record);
        document.getElementById('message').textContent = 'تم تسجيل حضورك بنجاح!';
        document.getElementById('message').style.color = 'green';
    }
});

// تحقق من تكرار الحضور
async function isAlreadyCheckedIn(phone, date) {
    const q = query(collection(db, 'records'));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.some(doc => doc.data().phone === phone && doc.data().date === date);
}

// دالة المسافة
function getDistance(lat1, lon1, lat2, lon2) {
    const R = 6371000; // نصف قطر الأرض بالمتر
    const dLat = deg2rad(lat2 - lat1);
    const dLon = deg2rad(lon2 - lon1);
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) + Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) * Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
}

function deg2rad(deg) {
    return deg * (Math.PI / 180);
}

// حفظ السجل
async function saveRecord(record) {
    await addDoc(collection(db, 'records'), record);
}

// لوحة الإدارة
document.getElementById('adminBtn').addEventListener('click', function() {
    document.getElementById('loginForm').style.display = 'block';
});

document.getElementById('loginSubmit').addEventListener('click', async function() {
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;
    if (username === 'yousef' && password === '1500') {
        document.getElementById('loginForm').style.display = 'none';
        document.getElementById('adminPanel').style.display = 'block';
        await loadSettings();
        await loadRecords();
    } else {
        document.getElementById('loginMessage').textContent = 'اسم أو كلمة مرور خاطئة!';
    }
});

document.getElementById('closeAdmin').addEventListener('click', function() {
    document.getElementById('adminPanel').style.display = 'none';
});

// حفظ الأوقات
document.getElementById('saveHours').addEventListener('click', saveSettings);

// حفظ الموقع
document.getElementById('saveLocation').addEventListener('click', saveSettings);

// تفعيل/تعطيل التقييد بالموقع
document.getElementById('toggleLocationRestriction').addEventListener('click', function() {
    settings.locationRestriction = !settings.locationRestriction;
    saveSettings();
    updateLocationMessage();
    if (!settings.locationRestriction) {
        document.getElementById('message').textContent = 'التقييد بالموقع معطل. يمكنك تسجيل الحضور من أي مكان.';
        document.getElementById('message').style.color = 'orange';
    }
});

// تحديث رسالة حالة التقييد بالموقع
function updateLocationMessage() {
    const locationMessage = document.getElementById('locationMessage');
    locationMessage.textContent = settings.locationRestriction ? 'التقييد بالموقع مفعل حالياً.' : 'التقييد بالموقع معطل حالياً.';
    locationMessage.style.color = settings.locationRestriction ? 'green' : 'red';
}

// عرض السجلات
async function loadRecords() {
    const recordsList = document.getElementById('recordsList');
    recordsList.innerHTML = '';
    const querySnapshot = await getDocs(collection(db, 'records'));
    querySnapshot.forEach((doc) => {
        const rec = doc.data();
        const li = document.createElement('li');
        li.textContent = `${rec.name} - ${rec.phone} - ${rec.date} ${rec.time}`;
        recordsList.appendChild(li);
    });
}

// تصدير Excel
document.getElementById('exportBtn').addEventListener('click', async function() {
    const querySnapshot = await getDocs(collection(db, 'records'));
    const records = querySnapshot.docs.map(doc => doc.data());
    if (records.length === 0) {
        alert('لا توجد سجلات للتصدير.');
        return;
    }
    
    const ws_data = records.map(rec => ({
        'الاسم': rec.name,
        'رقم الجوال': rec.phone,
        'البريد': rec.email,
        'التاريخ': rec.date,
        'الوقت': rec.time
    }));
    
    const ws = XLSX.utils.json_to_sheet(ws_data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Attendance');
    XLSX.writeFile(wb, 'attendance.xlsx');
});

// حذف السجلات
document.getElementById('clearRecords').addEventListener('click', async function() {
    if (confirm('هل أنت متأكد من حذف جميع السجلات؟')) {
        const querySnapshot = await getDocs(collection(db, 'records'));
        const batch = writeBatch(db);
        querySnapshot.forEach((doc) => {
            batch.delete(doc.ref);
        });
        await batch.commit();
        await loadRecords();
        alert('تم الحذف!');
    }
});

window.onload = async function() {
    await loadSettings();
};
