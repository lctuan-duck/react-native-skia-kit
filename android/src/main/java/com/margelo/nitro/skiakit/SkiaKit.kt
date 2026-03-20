package com.margelo.nitro.skiakit
  
import com.facebook.proguard.annotations.DoNotStrip

@DoNotStrip
class SkiaKit : HybridSkiaKitSpec() {
  override fun multiply(a: Double, b: Double): Double {
    return a * b
  }
}
