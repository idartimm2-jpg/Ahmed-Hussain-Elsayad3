// متغيرات عامة
let mediaRecorder;
let audioChunks = [];
let isRecording = false;
let selectedFiles = [];

// رابط Google Apps Script (يجب استبداله بعد النشر)
const GOOGLE_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbyJEH9FZxlX4LNgMfOe0N6y7VWigGeTzrVxXMSzNfZ2Vv-9IOyoIDMI9fLir455SxjXpQ/exec';

// تهيئة الصفحة
document.addEventListener('DOMContentLoaded', function () {
    initializeSlider();
    initializeRecording();
    initializeFileUpload();
    setupFormSubmit();
    setupModalClose();
});

// ======================== Slider Functionality ========================
function initializeSlider() {
    const slider = document.querySelector('.slider-track');
    const thumb = document.getElementById('sliderThumb');
    const districtInput = document.getElementById('district');
    const options = ['بندر المنيا', 'مركز المنيا', 'المنيا الجديدة'];

    let isDragging = false;

    function updateSliderPosition(event) {
        if (!isDragging && event.type !== 'click') return;

        const rect = slider.getBoundingClientRect();
        const x = event.clientX - rect.left;
        const percentage = Math.max(0, Math.min(100, (x / rect.width) * 100));

        // تحديد الخيار الأقرب
        let selectedIndex = Math.round((percentage / 100) * 2);
        selectedIndex = Math.max(0, Math.min(2, selectedIndex));

        const actualPercentage = (selectedIndex / 2) * 100;

        thumb.style.left = actualPercentage + '%';
        districtInput.value = options[selectedIndex];

        // تأثير بصري
        thumb.style.transform = 'scale(1)';
    }

    thumb.addEventListener('mousedown', () => {
        isDragging = true;
        thumb.style.transform = 'scale(1.2)';
    });

    document.addEventListener('mouseup', () => {
        isDragging = false;
    });

    document.addEventListener('mousemove', updateSliderPosition);

    slider.addEventListener('click', (event) => {
        const rect = slider.getBoundingClientRect();
        const x = event.clientX - rect.left;
        const percentage = Math.max(0, Math.min(100, (x / rect.width) * 100));

        let selectedIndex = Math.round((percentage / 100) * 2);
        selectedIndex = Math.max(0, Math.min(2, selectedIndex));

        const actualPercentage = (selectedIndex / 2) * 100;
        thumb.style.left = actualPercentage + '%';
        districtInput.value = options[selectedIndex];
    });

    // Touch support for mobile
    thumb.addEventListener('touchstart', () => {
        isDragging = true;
    });

    document.addEventListener('touchend', () => {
        isDragging = false;
    });

    document.addEventListener('touchmove', (event) => {
        if (!isDragging) return;
        const touch = event.touches[0];
        const rect = slider.getBoundingClientRect();
        const x = touch.clientX - rect.left;
        const percentage = Math.max(0, Math.min(100, (x / rect.width) * 100));

        let selectedIndex = Math.round((percentage / 100) * 2);
        selectedIndex = Math.max(0, Math.min(2, selectedIndex));

        const actualPercentage = (selectedIndex / 2) * 100;
        thumb.style.left = actualPercentage + '%';
        districtInput.value = options[selectedIndex];
    });
}

// ======================== Audio Recording ========================
function initializeRecording() {
    const recordBtn = document.getElementById('recordBtn');
    const stopBtn = document.getElementById('stopBtn');
    const audioPlayback = document.getElementById('audioPlayback');
    const audioPlayer = document.getElementById('audioPlayer');
    const deleteAudioBtn = document.getElementById('deleteAudio');

    recordBtn.addEventListener('click', startRecording);
    stopBtn.addEventListener('click', stopRecording);
    deleteAudioBtn.addEventListener('click', deleteAudio);

    async function startRecording() {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            mediaRecorder = new MediaRecorder(stream);
            audioChunks = [];
            isRecording = true;

            mediaRecorder.addEventListener('dataavailable', (event) => {
                audioChunks.push(event.data);
            });

            mediaRecorder.addEventListener('stop', () => {
                const audioBlob = new Blob(audioChunks, { type: 'audio/wav' });
                const audioUrl = URL.createObjectURL(audioBlob);
                audioPlayer.src = audioUrl;
                audioPlayback.style.display = 'block';
                // Store audio for submission
                audioPlayer.dataset.blob = audioUrl;
            });

            mediaRecorder.start();
            recordBtn.style.display = 'none';
            stopBtn.style.display = 'inline-block';
            recordBtn.textContent = '🎤 جاري التسجيل...';

            // Timer
            let seconds = 0;
            const timerInterval = setInterval(() => {
                seconds++;
                stopBtn.textContent = `⏹️ إيقاف (${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')})`;
                if (!isRecording) clearInterval(timerInterval);
            }, 1000);
        } catch (error) {
            alert('خطأ في الوصول إلى الميكروفون. تأكد من منح الإذن.');
            console.error('Error accessing microphone:', error);
        }
    }

    function stopRecording() {
        if (mediaRecorder && isRecording) {
            mediaRecorder.stop();
            mediaRecorder.stream.getTracks().forEach(track => track.stop());
            isRecording = false;
            recordBtn.style.display = 'inline-block';
            stopBtn.style.display = 'none';
            recordBtn.textContent = '🎤 إعادة التسجيل';
        }
    }

    function deleteAudio() {
        audioPlayer.src = '';
        audioPlayback.style.display = 'none';
        audioChunks = [];
        recordBtn.textContent = '🎤 بدء التسجيل';
        recordBtn.style.display = 'inline-block';
        stopBtn.style.display = 'none';
    }
}

// ======================== File Upload ========================
function initializeFileUpload() {
    const fileInput = document.getElementById('attachment');
    const filePreview = document.getElementById('filePreview');

    fileInput.addEventListener('change', function (e) {
        const newFiles = Array.from(e.target.files);
        // Append unique files only
        newFiles.forEach(file => {
            const isDuplicate = selectedFiles.some(f => f.name === file.name && f.size === file.size && f.lastModified === file.lastModified);
            if (!isDuplicate) {
                selectedFiles.push(file);
            }
        });
        updateFilePreview();
        // Clear input so the same file can be re-added if deleted from preview
        fileInput.value = '';
    });

    function updateFilePreview() {
        filePreview.innerHTML = '';
        selectedFiles.forEach((file, index) => {
            const fileItem = document.createElement('div');
            fileItem.className = 'file-item';

            const fileName = document.createElement('span');
            fileName.textContent = `📄 ${file.name}`;

            const removeBtn = document.createElement('span');
            removeBtn.className = 'file-item-remove';
            removeBtn.textContent = '✕';
            removeBtn.onclick = () => {
                selectedFiles.splice(index, 1);
                updateFilePreview();
            };

            fileItem.appendChild(fileName);
            fileItem.appendChild(removeBtn);
            filePreview.appendChild(fileItem);
        });
    }
}

// ======================== Form Submission ========================
function setupFormSubmit() {
    const form = document.getElementById('complaintForm');
    const loadingOverlay = document.getElementById('loadingOverlay');

    form.addEventListener('submit', async function (e) {
        e.preventDefault();

        // Validate form
        if (!validateForm()) return;

        // Show loading
        loadingOverlay.style.display = 'flex';

        try {
            // Collect form data
            const formData = {
                name: document.getElementById('name').value,
                age: document.getElementById('age').value,
                idNumber: document.getElementById('idNumber').value,
                district: document.getElementById('district').value,
                detailedAddress: document.getElementById('detailedAddress').value,
                complaint: document.getElementById('complaint').value,
                timestamp: new Date().toLocaleString('ar-EG')
            };

            // 0. Generate Folder Name Safely
            let safeTimestamp = formData.timestamp.replace(/[\/:\s]/g, '-');
            const folderName = `${formData.name} - ${formData.idNumber} - ${safeTimestamp}`;
            const driveLinks = [];
            let mainFolderUrl = '';

            // 1. Upload Audio if exists
            const audioPlayer = document.getElementById('audioPlayer');
            const hasAudio = !!audioPlayer.src && document.getElementById('audioPlayback').style.display !== 'none';

            if (hasAudio && audioChunks.length > 0) {
                const audioBlob = new Blob(audioChunks, { type: 'audio/wav' });
                const audioBase64 = await blobToBase64(audioBlob);
                const result = await uploadToDrive(audioBase64, `recording_${Date.now()}.wav`, 'audio/wav', folderName);
                if (result && result.url) {
                    driveLinks.push({ name: 'التسجيل الصوتي', url: result.url });
                    mainFolderUrl = result.folderUrl;
                }
            }

            // 2. Upload Selected Files
            for (const file of selectedFiles) {
                const fileBase64 = await fileToBase64(file);
                const result = await uploadToDrive(fileBase64, file.name, file.type, folderName);
                if (result && result.url) {
                    driveLinks.push({ name: file.name, url: result.url });
                    if (!mainFolderUrl) mainFolderUrl = result.folderUrl;
                }
            }

            // Format message for WhatsApp
            const message = formatWhatsAppMessage(formData, driveLinks, mainFolderUrl);

            // Open WhatsApp Directly
            sendToWhatsApp(message);

        } catch (error) {
            console.error('Final Submission error:', error);
            alert('حدث خطأ أثناء رفع الملفات. سيتم محاولة إرسال الطلب بدون الروابط الجديدة.');

            const message = formatWhatsAppMessage(formData, [], '');
            sendToWhatsApp(message);
        } finally {
            // Hide loading
            loadingOverlay.style.display = 'none';
        }
    });
}

// Helpers for Drive Upload
async function fileToBase64(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => resolve(reader.result.split(',')[1]);
        reader.onerror = error => reject(error);
    });
}

async function blobToBase64(blob) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(blob);
        reader.onloadend = () => resolve(reader.result.split(',')[1]);
        reader.onerror = error => reject(error);
    });
}

async function uploadToDrive(base64, filename, mimetype, folderName) {
    if (GOOGLE_SCRIPT_URL === 'YOUR_WEB_APP_URL_HERE' || GOOGLE_SCRIPT_URL === '') {
        console.warn('Google Script URL not set. Skipping upload.');
        return null;
    }

    try {
        const response = await fetch(GOOGLE_SCRIPT_URL, {
            method: 'POST',
            body: JSON.stringify({
                filename: filename,
                mimetype: mimetype,
                base64: base64,
                folderName: folderName
            })
        });

        const result = await response.json();
        if (result.status === 'success') {
            return { url: result.url, folderUrl: result.folderUrl };
        } else {
            console.error('Drive upload failed:', result.message);
            return null;
        }
    } catch (e) {
        console.error('Upload error:', e);
        return null;
    }
}

function validateForm() {
    const name = document.getElementById('name').value.trim();
    const age = document.getElementById('age').value;
    const idNumber = document.getElementById('idNumber').value.trim();
    const detailedAddress = document.getElementById('detailedAddress').value.trim();
    const complaint = document.getElementById('complaint').value.trim();

    if (!name || !age || !idNumber || !detailedAddress || !complaint) {
        alert('يرجى ملء جميع الحقول المطلوبة (المشار إليها بـ *)');
        return false;
    }

    // Validate age
    if (isNaN(age) || age < 1 || age > 150) {
        alert('يرجى إدخال سن صحيح');
        return false;
    }

    // Validate Egyptian ID (14 digits)
    if (!/^\d{14}$/.test(idNumber)) {
        alert('الرقم القومي يجب أن يكون 14 رقم');
        return false;
    }

    return true;
}

function formatWhatsAppMessage(data, driveLinks, mainFolderUrl) {
    let message = `
🔔 *شكوى أو طلب جديد*

👤 *الاسم:* ${data.name}
📅 *السن:* ${data.age}
🆔 *الرقم القومي:* ${data.idNumber}
📍 *المنطقة:* ${data.district}
🏠 *العنوان التفصيلي:* ${data.detailedAddress}

📝 *الشكوى/الطلب:*
${data.complaint}
`.trim();

    // Add Drive links if they exist
    if (mainFolderUrl) {
        message += `\n\n📂 *رابط مجلد المرفقات:* \n${mainFolderUrl}\n`;
    } else {
        message += `\n\n⚠️ *ملاحظة:* يرجى إرفاق المرفقات يدوياً في حال لم يتم رفعها بنجاح.`;
    }

    message += `\n\n⏰ *التاريخ والوقت:* ${data.timestamp}`;

    return message;
}

function sendToWhatsApp(message) {
    const phoneNumber = '201026465273'; // WhatsApp number
    const encodedMessage = encodeURIComponent(message);

    // Create WhatsApp link
    const whatsappUrl = `https://wa.me/${phoneNumber}?text=${encodedMessage}`;

    // Open WhatsApp
    const win = window.open(whatsappUrl, '_blank');

    // Return true if window was opened, false if blocked
    if (!win || win.closed || typeof win.closed == 'undefined') {
        return false;
    }

    // Start clearing form data
    selectedFiles = [];
    if (typeof deleteAudio === 'function') deleteAudio();
    document.getElementById('complaintForm').reset();
    document.getElementById('filePreview').innerHTML = '';

    return true;
}

// ======================== Modal Functionality ========================
function showSuccessModal() {
    const modal = document.getElementById('successModal');
    modal.style.display = 'flex';
}

function setupModalClose() {
    const modal = document.getElementById('successModal');
    const closeBtn = document.querySelector('.close');
    const closeModalBtn = document.querySelector('.btn-close-modal');

    closeBtn.onclick = () => {
        modal.style.display = 'none';
    };

    closeModalBtn.onclick = () => {
        modal.style.display = 'none';
    };

    window.onclick = (event) => {
        if (event.target === modal) {
            modal.style.display = 'none';
        }
    };
}

// ======================== Input Formatting ========================
// Format national ID input to accept only numbers
document.addEventListener('DOMContentLoaded', function () {
    const idInput = document.getElementById('idNumber');
    idInput.addEventListener('input', function (e) {
        this.value = this.value.replace(/[^\d]/g, '').slice(0, 14);
    });

    const ageInput = document.getElementById('age');
    ageInput.addEventListener('input', function (e) {
        this.value = this.value.replace(/[^\d]/g, '').slice(0, 3);
    });
});
