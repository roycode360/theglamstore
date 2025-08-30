export type CloudinaryConfig = {
  uploadPreset: string
  cloudName: string
}

export async function uploadToCloudinary(file: File, config?: Partial<CloudinaryConfig>): Promise<{ secure_url: string }>{
  const cloudName = config?.cloudName ?? import.meta.env.VITE_CLOUDINARY_CLOUD_NAME
  const uploadPreset = config?.uploadPreset ?? import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET
  if (!cloudName || !uploadPreset) throw new Error('Missing Cloudinary config')

  const form = new FormData()
  form.append('file', file)
  form.append('upload_preset', String(uploadPreset))

  const res = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
    method: 'POST',
    body: form,
  })
  if (!res.ok) throw new Error('Upload failed')
  const data = await res.json()
  return { secure_url: data.secure_url }
}


