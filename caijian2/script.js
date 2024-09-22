const dropZone = document.getElementById('dropZone');
const fileInput = document.getElementById('fileInput');
const fileList = document.getElementById('fileList');
const interval = document.getElementById('interval');
const splitButton = document.getElementById('splitButton');
const results = document.getElementById('results');
const downloadAllButton = document.getElementById('downloadAllButton');
const statusMessage = document.getElementById('statusMessage');
const logContainer = document.getElementById('logContainer');
const languageToggle = document.getElementById('languageToggle');

let files = [];
let allSplitImages = [];
let isEnglish = false;

const translations = {
    title: { en: 'Long Image Splitting Tool', zh: '长图分割工具' },
    dropText: { en: 'Drag and drop image files here, or click to select files', zh: '拖放图片文件到此处,或点击选择文件' },
    intervalLabel: { en: 'Split Interval (pixels):', zh: '分割间隔 (像素):' },
    splitButton: { en: 'Start Splitting', zh: '开始分割' },
    downloadAllButton: { en: 'Download ZIP', zh: '下载 ZIP' },
    languageToggle: { en: '中文', zh: 'English' },
    processingFile: { en: 'Processing file', zh: '正在处理文件' },
    splittingComplete: { en: 'Splitting complete', zh: '分割完成' },
    preparingDownload: { en: 'Preparing download...', zh: '准备下载中...' },
    downloadReady: { en: 'Download ready!', zh: '下载准备就绪！' },
};

function updateLanguage() {
    document.getElementById('title').textContent = translations.title[isEnglish ? 'en' : 'zh'];
    document.getElementById('dropText').textContent = translations.dropText[isEnglish ? 'en' : 'zh'];
    document.getElementById('intervalLabel').textContent = translations.intervalLabel[isEnglish ? 'en' : 'zh'];
    splitButton.textContent = translations.splitButton[isEnglish ? 'en' : 'zh'];
    downloadAllButton.textContent = translations.downloadAllButton[isEnglish ? 'en' : 'zh'];
    languageToggle.textContent = translations.languageToggle[isEnglish ? 'en' : 'zh'];
}

languageToggle.addEventListener('click', () => {
    isEnglish = !isEnglish;
    updateLanguage();
});

function showStatus(message) {
    statusMessage.textContent = message;
    statusMessage.style.display = 'block';
    setTimeout(() => {
        statusMessage.style.display = 'none';
    }, 3000);
}

function log(message) {
    const logEntry = document.createElement('div');
    logEntry.textContent = message;
    logContainer.appendChild(logEntry);
    logContainer.scrollTop = logContainer.scrollHeight;
}

dropZone.addEventListener('click', () => fileInput.click());

dropZone.addEventListener('dragover', (e) => {
    e.preventDefault();
    dropZone.classList.add('dragover');
});

dropZone.addEventListener('dragleave', () => {
    dropZone.classList.remove('dragover');
});

dropZone.addEventListener('drop', (e) => {
    e.preventDefault();
    dropZone.classList.remove('dragover');
    handleFiles(e.dataTransfer.files);
});

fileInput.addEventListener('change', (e) => {
    handleFiles(e.target.files);
});

function handleFiles(newFiles) {
    files = [...files, ...newFiles];
    updateFileList();
}

function updateFileList() {
    fileList.innerHTML = '';
    files.forEach((file, index) => {
        const fileItem = document.createElement('div');
        fileItem.className = 'file-item';
        fileItem.textContent = file.name;

        const removeButton = document.createElement('button');
        removeButton.textContent = '删除';
        removeButton.onclick = () => removeFile(index);

        fileItem.appendChild(removeButton);
        fileList.appendChild(fileItem);
    });
}

function removeFile(index) {
    files.splice(index, 1);
    updateFileList();
}

splitButton.addEventListener('click', () => {
    results.innerHTML = '';
    allSplitImages = [];
    files.forEach(splitImage);
});

function splitImage(file) {
    const reader = new FileReader();
    reader.onload = function(event) {
        const img = new Image();
        img.onload = function() {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            const splitHeight = parseInt(interval.value);
            const numSplits = Math.ceil(img.height / splitHeight);

            log(`${translations.processingFile[isEnglish ? 'en' : 'zh']}: ${file.name}`);

            const resultItem = document.createElement('div');
            resultItem.className = 'result-item';
            const resultTitle = document.createElement('h3');
            resultTitle.textContent = file.name;
            resultItem.appendChild(resultTitle);

            const resultImages = document.createElement('div');
            resultImages.className = 'result-images';
            resultItem.appendChild(resultImages);

            for (let i = 0; i < numSplits; i++) {
                canvas.width = img.width;
                canvas.height = Math.min(splitHeight, img.height - i * splitHeight);
                ctx.drawImage(img, 0, i * splitHeight, img.width, canvas.height, 0, 0, img.width, canvas.height);

                const splitImg = document.createElement('img');
                splitImg.src = canvas.toDataURL('image/png');
                splitImg.className = 'result-image';
                resultImages.appendChild(splitImg);

                allSplitImages.push({
                    name: `${file.name.split('.')[0]}_part${i + 1}.png`,
                    data: splitImg.src
                });
            }

            results.appendChild(resultItem);
            log(`${translations.splittingComplete[isEnglish ? 'en' : 'zh']}: ${file.name}`);
        };
        img.src = event.target.result;
    };
    reader.readAsDataURL(file);
}

downloadAllButton.addEventListener('click', async () => {
    showStatus(translations.preparingDownload[isEnglish ? 'en' : 'zh']);
    const zip = new JSZip();

    for (const image of allSplitImages) {
        const response = await fetch(image.data);
        const blob = await response.blob();
        zip.file(image.name, blob);
    }

    zip.generateAsync({ type: 'blob' }).then(function(content) {
        saveAs(content, 'split_images.zip');
        showStatus(translations.downloadReady[isEnglish ? 'en' : 'zh']);
    });
});

// 监听结果变化，显示或隐藏"下载 ZIP"按钮
const observer = new MutationObserver(() => {
    downloadAllButton.style.display = results.children.length > 0 ? 'inline-block' : 'none';
});
observer.observe(results, { childList: true });