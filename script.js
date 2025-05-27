let originalImageData = null;
        let canvas = null;
        let ctx = null;
        let processingTimeout = null;

        // Ön Ayarları
        const presets = {
            classic: { pixelSize: 8, colorReduction: 16, contrast: 10, saturation: 90, dithering: false },
            retro: { pixelSize: 12, colorReduction: 8, contrast: 25, saturation: 120, dithering: true },
            modern: { pixelSize: 6, colorReduction: 64, contrast: 5, saturation: 110, dithering: false },
            artistic: { pixelSize: 10, colorReduction: 32, contrast: 20, saturation: 130, dithering: true }
        };

        
        document.addEventListener('DOMContentLoaded', function() {
            canvas = document.getElementById('pixelCanvas');
            ctx = canvas.getContext('2d');
            
            // Dosya giriş
            document.getElementById('fileInput').addEventListener('change', handleFileSelect);
            
            document.getElementById('pixelSize').addEventListener('input', updateSliderValues);
            document.getElementById('resolution').addEventListener('input', updateSliderValues);
            document.getElementById('colorReduction').addEventListener('input', updateSliderValues);
            document.getElementById('contrast').addEventListener('input', updateSliderValues);
            document.getElementById('saturation').addEventListener('input', updateSliderValues);
            document.getElementById('sharpening').addEventListener('input', updateSliderValues);
            document.getElementById('processBtn').addEventListener('click', generatePixelArt);
            document.getElementById('downloadBtn').addEventListener('click', downloadPixelArt);
            
            // Ön ayar butonu
            document.querySelectorAll('.preset-btn').forEach(btn => {
                btn.addEventListener('click', applyPreset);
            });
            
            // Sürükleme alanı
            const uploadArea = document.querySelector('.upload-area');
            uploadArea.addEventListener('dragover', handleDragOver);
            uploadArea.addEventListener('drop', handleDrop);
            
            // Kaydırıcı
            updateSliderValues();
        });

        function handleFileSelect(event) {
            const file = event.target.files[0];
            if (file) {
                loadImage(file);
            }
        }

        function handleDragOver(event) {
            event.preventDefault();
        }

        function handleDrop(event) {
            event.preventDefault();
            const files = event.dataTransfer.files;
            if (files.length > 0) {
                loadImage(files[0]);
            }
        }

        function loadImage(file) {
            if (!file.type.startsWith('image/')) {
                alert('Lütfen sadece resim yükleyin.');
                return;
            }

            if (file.size > 20 * 1024 * 1024) {
                alert('Dosya boyutu en fazla 20MB olabilir.');
                return;
            }

            const reader = new FileReader();
            reader.onload = function(e) {
                const img = new Image();
                img.onload = function() {
                    originalImageData = img;
                    document.getElementById('originalImage').src = e.target.result;
                    document.getElementById('controls').classList.remove('hidden');
                    updateSliderValues();
                };
                img.src = e.target.result;
            };
            reader.readAsDataURL(file);
        }

        function updateSliderValues() {
            const pixelSize = document.getElementById('pixelSize').value;
            const resolution = document.getElementById('resolution').value;
            const colorReduction = document.getElementById('colorReduction').value;
            const contrast = document.getElementById('contrast').value;
            const saturation = document.getElementById('saturation').value;
            const sharpening = document.getElementById('sharpening').value;
            
            document.getElementById('pixelSizeValue').textContent = pixelSize + 'px';
            document.getElementById('resolutionValue').textContent = resolution + 'x';
            document.getElementById('colorReductionValue').textContent = colorReduction + ' colors';
            document.getElementById('contrastValue').textContent = contrast + '%';
            document.getElementById('saturationValue').textContent = saturation + '%';
            document.getElementById('sharpeningValue').textContent = sharpening + '%';
        }

        function applyPreset(event) {
            const presetName = event.target.dataset.preset;
            const preset = presets[presetName];
            
            // Ön Ayar Butonu
            document.querySelectorAll('.preset-btn').forEach(btn => btn.classList.remove('active'));
            event.target.classList.add('active');
            
            // Hazır değerler
            document.getElementById('pixelSize').value = preset.pixelSize;
            document.getElementById('colorReduction').value = preset.colorReduction;
            document.getElementById('contrast').value = preset.contrast;
            document.getElementById('saturation').value = preset.saturation;
            document.getElementById('dithering').checked = preset.dithering;
            
            updateSliderValues();
        }

        function showProcessingOverlay() {
            document.getElementById('processingOverlay').classList.add('active');
        }

        function hideProcessingOverlay() {
            document.getElementById('processingOverlay').classList.remove('active');
        }

        function generatePixelArt() {
            if (!originalImageData) return;

            showProcessingOverlay();
            
            // Arayüz güncellemesi
            setTimeout(() => {
                try {
                    processPixelArt();
                } catch (error) {
                    console.error('Error processing image:', error);
                    alert('Görüntü işlenirken bir hata oluştu. Lütfen tekrar deneyin.');
                }
                hideProcessingOverlay();
            }, 100);
        }

        function processPixelArt() {
            const pixelSize = parseInt(document.getElementById('pixelSize').value);
            const resolution = parseInt(document.getElementById('resolution').value);
            const maxColors = parseInt(document.getElementById('colorReduction').value);
            const contrast = parseInt(document.getElementById('contrast').value);
            const saturation = parseInt(document.getElementById('saturation').value);
            const sharpening = parseInt(document.getElementById('sharpening').value);
            const dithering = document.getElementById('dithering').checked;
            const edgeEnhancement = document.getElementById('edgeEnhancement').checked;
            const antiAliasing = document.getElementById('antiAliasing').checked;
            const colorAlgorithm = document.getElementById('colorAlgorithm').value;

            // Boyut hesap
            const originalWidth = originalImageData.width;
            const originalHeight = originalImageData.height;
            
            // Pixelleşme küçültmesi
            const pixelWidth = Math.floor(originalWidth / pixelSize);
            const pixelHeight = Math.floor(originalHeight / pixelSize);
            
            // Tuval boyutu ayarı
            canvas.width = pixelWidth * pixelSize * resolution;
            canvas.height = pixelHeight * pixelSize * resolution;

            // Çalışma tuvali
            const tempCanvas = document.createElement('canvas');
            const tempCtx = tempCanvas.getContext('2d');
            tempCanvas.width = pixelWidth;
            tempCanvas.height = pixelHeight;

            const workCanvas = document.createElement('canvas');
            const workCtx = workCanvas.getContext('2d');
            workCanvas.width = originalWidth;
            workCanvas.height = originalHeight;

            // GÖrüntü iyileştirme
            workCtx.drawImage(originalImageData, 0, 0);
            let imageData = workCtx.getImageData(0, 0, originalWidth, originalHeight);
            
            if (contrast > 0 || saturation !== 100 || sharpening > 0) {
                imageData = applyEnhancements(imageData, contrast, saturation, sharpening);
                workCtx.putImageData(imageData, 0, 0);
            }

            // Kenar iyileştirme
            if (edgeEnhancement) {
                imageData = applyEdgeEnhancement(workCtx.getImageData(0, 0, originalWidth, originalHeight));
                workCtx.putImageData(imageData, 0, 0);
            }

            // Kenar yumuşatma
            if (antiAliasing) {
                tempCtx.imageSmoothingEnabled = true;
                tempCtx.imageSmoothingQuality = 'high';
            } else {
                tempCtx.imageSmoothingEnabled = false;
            }
            
            tempCtx.drawImage(workCanvas, 0, 0, pixelWidth, pixelHeight);
            imageData = tempCtx.getImageData(0, 0, pixelWidth, pixelHeight);

            // Renk ayarı
            const quantizedData = applyColorQuantization(imageData, maxColors, colorAlgorithm, dithering);
            tempCtx.putImageData(quantizedData, 0, 0);

            // Pixel efekti
            ctx.imageSmoothingEnabled = false;
            ctx.drawImage(tempCanvas, 0, 0, canvas.width, canvas.height);

            // Sonuçlar gösterme
            document.getElementById('results').classList.remove('hidden');
        }

        function applyEnhancements(imageData, contrast, saturation, sharpening) {
            const data = imageData.data;
            const width = imageData.width;
            const height = imageData.height;
            
            // Keskinleştirme
            const originalData = new Uint8ClampedArray(data);
            
            for (let i = 0; i < data.length; i += 4) {
                let r = data[i];
                let g = data[i + 1];
                let b = data[i + 2];
                
                // KOntrast
                if (contrast > 0) {
                    const factor = (259 * (contrast + 255)) / (255 * (259 - contrast));
                    r = Math.max(0, Math.min(255, factor * (r - 128) + 128));
                    g = Math.max(0, Math.min(255, factor * (g - 128) + 128));
                    b = Math.max(0, Math.min(255, factor * (b - 128) + 128));
                }
                
                // Satürasyon
                if (saturation !== 100) {
                    const gray = 0.299 * r + 0.587 * g + 0.114 * b;
                    const satFactor = saturation / 100;
                    r = Math.max(0, Math.min(255, gray + satFactor * (r - gray)));
                    g = Math.max(0, Math.min(255, gray + satFactor * (g - gray)));
                    b = Math.max(0, Math.min(255, gray + satFactor * (b - gray)));
                }
                
                data[i] = r;
                data[i + 1] = g;
                data[i + 2] = b;
            }
            
            // Maske ile kesnkinleştirme
            if (sharpening > 0) {
                const sharpenFactor = sharpening / 100;
                const kernel = [-1, -1, -1, -1, 9, -1, -1, -1, -1];
                
                for (let y = 1; y < height - 1; y++) {
                    for (let x = 1; x < width - 1; x++) {
                        for (let c = 0; c < 3; c++) {
                            let sum = 0;
                            for (let ky = -1; ky <= 1; ky++) {
                                for (let kx = -1; kx <= 1; kx++) {
                                    const idx = ((y + ky) * width + (x + kx)) * 4 + c;
                                    sum += originalData[idx] * kernel[(ky + 1) * 3 + (kx + 1)];
                                }
                            }
                            const idx = (y * width + x) * 4 + c;
                            const original = originalData[idx];
                            const sharpened = Math.max(0, Math.min(255, sum));
                            data[idx] = original + sharpenFactor * (sharpened - original);
                        }
                    }
                }
            }
            
            return imageData;
        }

        function applyEdgeEnhancement(imageData) {
            const data = imageData.data;
            const width = imageData.width;
            const height = imageData.height;
            const output = new Uint8ClampedArray(data);
            
            // Kenar
            const sobelX = [-1, 0, 1, -2, 0, 2, -1, 0, 1];
            const sobelY = [-1, -2, -1, 0, 0, 0, 1, 2, 1];
            
            for (let y = 1; y < height - 1; y++) {
                for (let x = 1; x < width - 1; x++) {
                    let gx = 0, gy = 0;
                    
                    for (let ky = -1; ky <= 1; ky++) {
                        for (let kx = -1; kx <= 1; kx++) {
                            const idx = ((y + ky) * width + (x + kx)) * 4;
                            const gray = 0.299 * data[idx] + 0.587 * data[idx + 1] + 0.114 * data[idx + 2];
                            const kernelIdx = (ky + 1) * 3 + (kx + 1);
                            gx += gray * sobelX[kernelIdx];
                            gy += gray * sobelY[kernelIdx];
                        }
                    }
                    
                    const magnitude = Math.sqrt(gx * gx + gy * gy);
                    const idx = (y * width + x) * 4;
                    
                    // Kenar iyileştirme
                    for (let c = 0; c < 3; c++) {
                        output[idx + c] = Math.min(255, data[idx + c] + magnitude * 0.3);
                    }
                }
            }
            
            return new ImageData(output, width, height);
        }

        function applyColorQuantization(imageData, maxColors, algorithm, dithering) {
            const data = imageData.data;
            const width = imageData.width;
            const height = imageData.height;
            
            let quantizedData;
            
            switch (algorithm) {
                case 'kmeans':
                    quantizedData = kmeansQuantization(imageData, maxColors);
                    break;
                case 'octree':
                    quantizedData = octreeQuantization(imageData, maxColors);
                    break;
                case 'median':
                    quantizedData = medianCutQuantization(imageData, maxColors);
                    break;
                case 'uniform':
                default:
                    quantizedData = uniformQuantization(imageData, maxColors);
                    break;
            }
            
            if (dithering) {
                quantizedData = applyFloydSteinbergDithering(imageData, quantizedData, maxColors);
            }
            
            return quantizedData;
        }

        function uniformQuantization(imageData, maxColors) {
            const data = new Uint8ClampedArray(imageData.data);
            const levelsPerChannel = Math.ceil(Math.pow(maxColors, 1/3));
            const step = 255 / (levelsPerChannel - 1);
            
            for (let i = 0; i < data.length; i += 4) {
                data[i] = Math.round(data[i] / step) * step;
                data[i + 1] = Math.round(data[i + 1] / step) * step;
                data[i + 2] = Math.round(data[i + 2] / step) * step;
            }
            
            return new ImageData(data, imageData.width, imageData.height);
        }

        function kmeansQuantization(imageData, k) {
            const data = imageData.data;
            const pixels = [];
            
            // Extract pixels
            for (let i = 0; i < data.length; i += 4) {
                pixels.push([data[i], data[i + 1], data[i + 2]]);
            }
            
            // Initialize centroids randomly
            const centroids = [];
            for (let i = 0; i < k; i++) {
                const randomPixel = pixels[Math.floor(Math.random() * pixels.length)];
                centroids.push([...randomPixel]);
            }
            
            // K-means iterations
            for (let iter = 0; iter < 10; iter++) {
                const clusters = Array.from({ length: k }, () => []);
                
                // Assign pixels to nearest centroid
                pixels.forEach(pixel => {
                    let minDist = Infinity;
                    let bestCluster = 0;
                    
                    centroids.forEach((centroid, idx) => {
                        const dist = Math.sqrt(
                            Math.pow(pixel[0] - centroid[0], 2) +
                            Math.pow(pixel[1] - centroid[1], 2) +
                            Math.pow(pixel[2] - centroid[2], 2)
                        );
                        if (dist < minDist) {
                            minDist = dist;
                            bestCluster = idx;
                        }
                    });
                    
                    clusters[bestCluster].push(pixel);
                });
                
                // Update centroids
                centroids.forEach((centroid, idx) => {
                    if (clusters[idx].length > 0) {
                        const sum = clusters[idx].reduce((acc, pixel) => [
                            acc[0] + pixel[0],
                            acc[1] + pixel[1],
                            acc[2] + pixel[2]
                        ], [0, 0, 0]);
                        
                        centroid[0] = sum[0] / clusters[idx].length;
                        centroid[1] = sum[1] / clusters[idx].length;
                        centroid[2] = sum[2] / clusters[idx].length;
                    }
                });
            }
            
            // Apply quantization
            const newData = new Uint8ClampedArray(data);
            for (let i = 0; i < data.length; i += 4) {
                const pixel = [data[i], data[i + 1], data[i + 2]];
                let minDist = Infinity;
                let bestCentroid = centroids[0];
                
                centroids.forEach(centroid => {
                    const dist = Math.sqrt(
                        Math.pow(pixel[0] - centroid[0], 2) +
                        Math.pow(pixel[1] - centroid[1], 2) +
                        Math.pow(pixel[2] - centroid[2], 2)
                    );
                    if (dist < minDist) {
                        minDist = dist;
                        bestCentroid = centroid;
                    }
                });
                
                newData[i] = Math.round(bestCentroid[0]);
                newData[i + 1] = Math.round(bestCentroid[1]);
                newData[i + 2] = Math.round(bestCentroid[2]);
            }
            
            return new ImageData(newData, imageData.width, imageData.height);
        }

        function octreeQuantization(imageData, maxColors) {
            // Simplified octree quantization
            const data = imageData.data;
            const colorMap = new Map();
            const colors = [];
            
            // Collect unique colors with frequency
            for (let i = 0; i < data.length; i += 4) {
                const color = (data[i] << 16) | (data[i + 1] << 8) | data[i + 2];
                colorMap.set(color, (colorMap.get(color) || 0) + 1);
            }
            
            // Sort by frequency and take top colors
            const sortedColors = Array.from(colorMap.entries())
                .sort((a, b) => b[1] - a[1])
                .slice(0, maxColors)
                .map(([color]) => [
                    (color >> 16) & 0xFF,
                    (color >> 8) & 0xFF,
                    color & 0xFF
                ]);
            
            // Apply quantization
            const newData = new Uint8ClampedArray(data);
            for (let i = 0; i < data.length; i += 4) {
                const pixel = [data[i], data[i + 1], data[i + 2]];
                let minDist = Infinity;
                let bestColor = sortedColors[0];
                
                sortedColors.forEach(color => {
                    const dist = Math.sqrt(
                        Math.pow(pixel[0] - color[0], 2) +
                        Math.pow(pixel[1] - color[1], 2) +
                        Math.pow(pixel[2] - color[2], 2)
                    );
                    if (dist < minDist) {
                        minDist = dist;
                        bestColor = color;
                    }
                });
                
                newData[i] = bestColor[0];
                newData[i + 1] = bestColor[1];
                newData[i + 2] = bestColor[2];
            }
            
            return new ImageData(newData, imageData.width, imageData.height);
        }

        function medianCutQuantization(imageData, maxColors) {
            // Simplified median cut algorithm
            const data = imageData.data;
            const pixels = [];
            
            for (let i = 0; i < data.length; i += 4) {
                pixels.push([data[i], data[i + 1], data[i + 2]]);
            }
            
            function medianCut(pixels, depth) {
                if (depth === 0 || pixels.length <= 1) {
                    // Return average color
                    const sum = pixels.reduce((acc, pixel) => [
                        acc[0] + pixel[0],
                        acc[1] + pixel[1],
                        acc[2] + pixel[2]
                    ], [0, 0, 0]);
                    return [[
                        Math.round(sum[0] / pixels.length),
                        Math.round(sum[1] / pixels.length),
                        Math.round(sum[2] / pixels.length)
                    ]];
                }
                
                // Find the channel with the largest range
                const ranges = [0, 1, 2].map(channel => {
                    const values = pixels.map(pixel => pixel[channel]);
                    return Math.max(...values) - Math.min(...values);
                });
                
                const maxChannel = ranges.indexOf(Math.max(...ranges));
                
                // Sort by the channel with largest range
                pixels.sort((a, b) => a[maxChannel] - b[maxChannel]);
                
                // Split at median
                const median = Math.floor(pixels.length / 2);
                const left = pixels.slice(0, median);
                const right = pixels.slice(median);
                
                return [
                    ...medianCut(left, depth - 1),
                    ...medianCut(right, depth - 1)
                ];
            }
            
            const palette = medianCut(pixels, Math.ceil(Math.log2(maxColors)));
            
            // Apply quantization
            const newData = new Uint8ClampedArray(data);
            for (let i = 0; i < data.length; i += 4) {
                const pixel = [data[i], data[i + 1], data[i + 2]];
                let minDist = Infinity;
                let bestColor = palette[0];
                
                palette.forEach(color => {
                    const dist = Math.sqrt(
                        Math.pow(pixel[0] - color[0], 2) +
                        Math.pow(pixel[1] - color[1], 2) +
                        Math.pow(pixel[2] - color[2], 2)
                    );
                    if (dist < minDist) {
                        minDist = dist;
                        bestColor = color;
                    }
                });
                
                newData[i] = bestColor[0];
                newData[i + 1] = bestColor[1];
                newData[i + 2] = bestColor[2];
            }
            
            return new ImageData(newData, imageData.width, imageData.height);
        }

        function applyFloydSteinbergDithering(originalData, quantizedData, maxColors) {
            const width = originalData.width;
            const height = originalData.height;
            const data = new Uint8ClampedArray(originalData.data);
            const quantData = quantizedData.data;
            
            for (let y = 0; y < height; y++) {
                for (let x = 0; x < width; x++) {
                    const idx = (y * width + x) * 4;
                    
                    for (let c = 0; c < 3; c++) {
                        const oldPixel = data[idx + c];
                        const newPixel = quantData[idx + c];
                        const error = oldPixel - newPixel;
                        
                        data[idx + c] = newPixel;
                        
                        // Distribute error to neighboring pixels
                        if (x + 1 < width) {
                            data[idx + 4 + c] += error * 7/16;
                        }
                        if (y + 1 < height && x > 0) {
                            data[((y + 1) * width + (x - 1)) * 4 + c] += error * 3/16;
                        }
                        if (y + 1 < height) {
                            data[((y + 1) * width + x) * 4 + c] += error * 5/16;
                        }
                        if (y + 1 < height && x + 1 < width) {
                            data[((y + 1) * width + (x + 1)) * 4 + c] += error * 1/16;
                        }
                    }
                }
            }
            
            return new ImageData(data, width, height);
        }

        function downloadPixelArt() {
            if (!canvas) return;

            const outputFormat = document.getElementById('outputFormat').value;
            let mimeType = 'image/png';
            let quality = 1.0;
            
            switch (outputFormat) {
                case 'jpg':
                    mimeType = 'image/jpeg';
                    quality = 0.95;
                    break;
                case 'webp':
                    mimeType = 'image/webp';
                    quality = 0.95;
                    break;
            }

            const link = document.createElement('a');
            link.download = `pixelforge-art-${Date.now()}.${outputFormat}`;
            link.href = canvas.toDataURL(mimeType, quality);
            link.click();
        }

        function error(){
            alert("Dosya Boyutu Büyük!")

        }