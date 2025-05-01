export const useCardBackground = () => {
    const dominantColor = ref({ r: 0, g: 0, b: 0 })
    const gradientBackgroundColor = ref('#000')

    const getAverageColor = async (imageUrl) => {
        return new Promise((resolve) => {
            const img = new Image()
            img.crossOrigin = 'Anonymous'
            img.src = imageUrl
            img.onload = () => {
                const canvas = document.createElement('canvas')
                const ctx = canvas.getContext('2d')
                canvas.width = img.width
                canvas.height = img.height
                ctx.drawImage(img, 0, 0)
                const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height).data
                let r = 0, g = 0, b = 0, count = 0
                for (let i = 0; i < imageData.length; i += 40) {
                    r += imageData[i]
                    g += imageData[i + 1]
                    b += imageData[i + 2]
                    count++
                }
                resolve({ r: r / count, g: g / count, b: b / count })
            }
        })
    }

    const gradientBackground = async () => {
        const { r, g, b } = dominantColor.value
        return `linear-gradient(to top,
      rgba(${r}, ${g}, ${b}, 0.8) 10%,
      rgba(${r}, ${g}, ${b}, 0.5) 40%,
      rgba(${r}, ${g}, ${b}, 0.2) 70%,
      transparent 100%)`
    }

    return { dominantColor, gradientBackgroundColor, getAverageColor, gradientBackground }
}