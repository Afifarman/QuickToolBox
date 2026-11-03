export function getLocalAIErrorMessage(cause) {
  const rawMessage = String(cause?.message || cause || '');
  const normalized = rawMessage.toLowerCase();

  if (/shadermodule|shader compilation|wgsl|pipeline.*invalid/.test(normalized)) {
    return 'GPU shader তৈরি করতে সমস্যা হয়েছে। Chrome/Edge আপডেট করুন, hardware acceleration চালু করুন, অন্য ভারী GPU app বন্ধ করুন এবং browser restart করে আবার চেষ্টা করুন। তবুও না হলে এই GPU/browser-এ মডেলটি compatible নাও হতে পারে।';
  }
  if (/out of memory|memory|allocation failed/.test(normalized)) {
    return 'এই মডেল চালানোর জন্য পর্যাপ্ত GPU memory পাওয়া যায়নি। অন্য GPU-নির্ভর tab/app বন্ধ করে আবার চেষ্টা করুন।';
  }
  if (/fetch|network|cors|http/.test(normalized)) {
    return 'মডেল ফাইল download করা যায়নি। Internet connection ও model host access পরীক্ষা করে আবার চেষ্টা করুন।';
  }
  return rawMessage || 'Local AI model could not be loaded. Check browser compatibility, internet connection, and available memory.';
}
