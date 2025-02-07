/**
 * 图片压缩工具的主要功能实现
 */
document.addEventListener('DOMContentLoaded', () => {
    const dropZone = document.getElementById('dropZone');
    const fileInput = document.getElementById('fileInput');
    const previewContainer = document.getElementById('previewContainer');
    const originalPreview = document.getElementById('originalPreview');
    const compressedPreview = document.getElementById('compressedPreview');
    const originalSize = document.getElementById('originalSize');
    const compressedSize = document.getElementById('compressedSize');
    const qualitySlider = document.getElementById('quality');
    const qualityValue = document.getElementById('qualityValue');
    const downloadBtn = document.getElementById('downloadBtn');
    const batchPreviewContainer = document.getElementById('batchPreviewContainer');
    const batchList = document.getElementById('batchList');
    const compressAllBtn = document.getElementById('compressAllBtn');
    const downloadAllBtn = document.getElementById('downloadAllBtn');

    let originalFile = null;
    let compressedFile = null;
    let batchFiles = []; // 存储批量处理的文件

    /**
     * 初始化拖放区域的事件监听
     */
    const initDropZone = () => {
        dropZone.addEventListener('click', () => fileInput.click());
        dropZone.addEventListener('dragover', (e) => {
            e.preventDefault();
            dropZone.style.borderColor = '#007AFF';
        });
        dropZone.addEventListener('dragleave', (e) => {
            e.preventDefault();
            dropZone.style.borderColor = '#ddd';
        });
        dropZone.addEventListener('drop', handleDrop);
    };

    /**
     * 处理文件拖放
     * @param {DragEvent} e - 拖放事件对象
     */
    const handleDrop = (e) => {
        e.preventDefault();
        dropZone.style.borderColor = '#ddd';
        const files = Array.from(e.dataTransfer.files);
        handleFiles(files);
    };

    /**
     * 处理多个文件
     * @param {File[]} files - 文件数组
     */
    const handleFiles = (files) => {
        const imageFiles = files.filter(file => file.type.startsWith('image/'));
        
        if (imageFiles.length === 0) {
            alert('请上传图片文件！');
            return;
        }

        if (imageFiles.length > 10) {
            alert('一次最多只能上传10张图片！');
            return;
        }

        batchFiles = imageFiles.map(file => ({
            original: file,
            compressed: null,
            status: '待处理'
        }));

        renderBatchList();
        batchPreviewContainer.style.display = 'block';
        previewContainer.style.display = 'none';
    };

    /**
     * 渲染批量处理列表
     */
    const renderBatchList = () => {
        batchList.innerHTML = batchFiles.map((item, index) => `
            <div class="batch-item">
                <img src="${URL.createObjectURL(item.original)}" alt="预览图">
                <div class="batch-item-info">
                    <div>文件名: ${item.original.name}</div>
                    <div>原始大小: ${formatFileSize(item.original.size)}</div>
                    <div>压缩后: ${item.compressed ? formatFileSize(item.compressed.size) : '-'}</div>
                </div>
                <div class="batch-item-status">${item.status}</div>
                <div class="batch-item-controls">
                    <button 
                        class="compress-btn" 
                        onclick="window.compressImage(${index})"
                        ${item.status === '压缩中...' ? 'disabled' : ''}
                    >
                        压缩
                    </button>
                    <button 
                        class="download-btn-small" 
                        onclick="window.downloadImage(${index})"
                        ${!item.compressed ? 'disabled' : ''}
                    >
                        下载
                    </button>
                </div>
            </div>
        `).join('');
    };

    /**
     * 压缩单个图片
     * @param {number} index - 图片在数组中的索引
     */
    const compressImage = async (index) => {
        const item = batchFiles[index];
        if (!item) return;

        item.status = '压缩中...';
        renderBatchList();

        const options = {
            maxSizeMB: 1,
            maxWidthOrHeight: 1920,
            useWebWorker: true,
            quality: document.getElementById('batchQuality').value / 100
        };

        try {
            item.compressed = await imageCompression(item.original, options);
            item.status = '完成';
        } catch (error) {
            console.error('压缩失败:', error);
            item.status = '失败';
        }
        renderBatchList();
    };

    /**
     * 下载单个压缩后的图片
     * @param {number} index - 图片在数组中的索引
     */
    const downloadImage = (index) => {
        const item = batchFiles[index];
        if (!item || !item.compressed) return;

        const link = document.createElement('a');
        link.href = URL.createObjectURL(item.compressed);
        link.download = 'compressed_' + item.original.name;
        link.click();
    };

    /**
     * 压缩所有图片
     */
    const compressAllImages = async () => {
        compressAllBtn.disabled = true;
        downloadAllBtn.disabled = true;

        for (let i = 0; i < batchFiles.length; i++) {
            if (batchFiles[i].status !== '完成') {
                await compressImage(i);
            }
        }

        compressAllBtn.disabled = false;
        downloadAllBtn.disabled = false;
    };

    /**
     * 下载所有压缩后的图片
     */
    const downloadAllImages = () => {
        const completedFiles = batchFiles.filter(item => item.compressed);
        if (completedFiles.length === 0) {
            alert('没有可下载的压缩图片！');
            return;
        }

        completedFiles.forEach(item => {
            const link = document.createElement('a');
            link.href = URL.createObjectURL(item.compressed);
            link.download = 'compressed_' + item.original.name;
            link.click();
        });
    };

    /**
     * 处理文件选择
     * @param {File} file - 选择的文件对象
     */
    const handleFile = async (file) => {
        if (!file.type.startsWith('image/')) {
            alert('请上传图片文件！');
            return;
        }

        originalFile = file;
        originalSize.textContent = formatFileSize(file.size);
        originalPreview.src = URL.createObjectURL(file);
        previewContainer.style.display = 'block';
        
        await compressImage();
    };

    /**
     * 格式化文件大小
     * @param {number} bytes - 文件大小（字节）
     * @returns {string} 格式化后的文件大小
     */
    const formatFileSize = (bytes) => {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    };

    // 修改文件输入事件监听
    fileInput.addEventListener('change', (e) => {
        if (e.target.files.length > 0) {
            handleFiles(Array.from(e.target.files));
        }
    });

    qualitySlider.addEventListener('input', (e) => {
        qualityValue.textContent = e.target.value + '%';
        if (originalFile) {
            compressImage();
        }
    });

    downloadBtn.addEventListener('click', () => {
        if (compressedFile) {
            const link = document.createElement('a');
            link.href = URL.createObjectURL(compressedFile);
            link.download = 'compressed_' + originalFile.name;
            link.click();
        }
    });

    // 添加新的事件监听器
    compressAllBtn.addEventListener('click', compressAllImages);
    downloadAllBtn.addEventListener('click', downloadAllImages);

    // 将函数添加到 window 对象，使其可以通过 onclick 调用
    window.compressImage = compressImage;
    window.downloadImage = downloadImage;

    // 添加批量压缩质量滑块事件监听
    document.getElementById('batchQuality').addEventListener('input', (e) => {
        document.getElementById('batchQualityValue').textContent = e.target.value + '%';
    });

    // 初始化
    initDropZone();
}); 