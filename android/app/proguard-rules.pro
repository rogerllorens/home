# React Native
-keep class com.facebook.react.** { *; }
-dontwarn com.facebook.react.**

# Camera
-keep class org.reactnative.camera.** { *; }
-dontwarn org.reactnative.camera.**

# FastImage
-keep class com.dylanvann.fastimage.** { *; }
-dontwarn com.dylanvann.fastimage.**

# Firebase
-keep class com.google.firebase.** { *; }
-dontwarn com.google.firebase.**

# Tesseract OCR
-keep class com.googlecode.tesseract.android.** { *; }
-dontwarn com.googlecode.tesseract.android.**

# MLKit
-keep class com.google.mlkit.** { *; }
-dontwarn com.google.mlkit.**

# React props
-keepclassmembers class * {
  @com.facebook.react.uimanager.annotations.ReactProp <methods>;
}
