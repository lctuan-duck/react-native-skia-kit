require "json"

package = JSON.parse(File.read(File.join(__dir__, "package.json")))

Pod::Spec.new do |s|
  s.name         = "SkiaKit"
  s.version      = package["version"]
  s.summary      = package["description"]
  s.homepage     = package["homepage"]
  s.license      = package["license"]
  s.authors      = package["author"]

  s.platforms    = { :ios => min_ios_version_supported }
  s.source       = { :git => "https://github.com/lctuan-duck/react-native-skia-kit.git", :tag => "#{s.version}" }

  s.source_files = [
    "ios/**/*.{swift,h,m,mm}",
    "cpp/**/*.{hpp,cpp}",
  ]

  s.dependency 'React-jsi'
  s.dependency 'React-callinvoker'
  # Shopify Skia — cung cấp Skia, skparagraph, JsiSkCanvas, RNSkPlatformContext
  s.dependency 'RNSkia'

  load 'nitrogen/generated/ios/SkiaKit+autolinking.rb'
  add_nitrogen_files(s)

  # react-native-skia node_modules path
  rnskia_dir = "$(PODS_ROOT)/../../../node_modules/@shopify/react-native-skia"

  s.pod_target_xcconfig = (s.attributes_hash['pod_target_xcconfig'] || {}).merge({
    "HEADER_SEARCH_PATHS" => [
      # Project headers
      "\"$(PODS_TARGET_SRCROOT)/cpp\"",
      "\"$(PODS_TARGET_SRCROOT)/cpp/core\"",
      "\"$(PODS_TARGET_SRCROOT)/cpp/subsystems\"",
      "\"$(PODS_TARGET_SRCROOT)/cpp/strategies\"",
      "\"$(PODS_TARGET_SRCROOT)/nitrogen/generated/shared/c++\"",
      # Shopify Skia headers (Skia core + skparagraph + JSI canvas API)
      "\"#{rnskia_dir}/cpp\"",
      "\"#{rnskia_dir}/cpp/api\"",
      "\"#{rnskia_dir}/cpp/rnskia\"",
      "\"#{rnskia_dir}/cpp/skia/include/core\"",
      "\"#{rnskia_dir}/cpp/skia/include/utils\"",
      "\"#{rnskia_dir}/cpp/skia/include/effects\"",
      "\"#{rnskia_dir}/cpp/skia/modules/skparagraph/include\"",
    ].join(" ")
  })

  install_modules_dependencies(s)
end
