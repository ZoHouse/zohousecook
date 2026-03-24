const isImageURL = (media: string) => {
    return media.includes('.png') || media.includes('.jpg') || media.includes('.jpeg') || media.includes('.svg') || media.includes('.webp') || media.includes('.gif');
}

export {
    isImageURL
}
