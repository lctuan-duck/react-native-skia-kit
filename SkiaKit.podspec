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
    "ios/**/*.{swift}",
    "ios/**/*.{m,mm}",
    "cpp/**/*.{hpp,cpp}",
  ]

  s.dependency 'React-jsi'
  s.dependency 'React-callinvoker'

  load 'nitrogen/generated/ios/SkiaKit+autolinking.rb'
  add_nitrogen_files(s)

  # Ensure C++ subsystem files can find nitrogen-generated headers
  s.pod_target_xcconfig = (s.attributes_hash['pod_target_xcconfig'] || {}).merge({
    "HEADER_SEARCH_PATHS" => "\"$(PODS_TARGET_SRCROOT)/cpp\" \"$(PODS_TARGET_SRCROOT)/cpp/subsystems\" \"$(PODS_TARGET_SRCROOT)/nitrogen/generated/shared/c++\""
  })

  install_modules_dependencies(s)
end
