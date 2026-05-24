# Add project specific ProGuard rules here.
# By default, the flags in this file are appended to flags specified
# in /usr/local/Cellar/android-sdk/24.3.3/tools/proguard/proguard-android.txt
# You can edit the include path and order by changing the proguardFiles
# directive in build.gradle.
#
# For more details, see
#   http://developer.android.com/guide/developing/tools/proguard.html

# Add any project specific keep options here:

# Keep TrackPlayer classes used by SyncPositionModule reflection
-keep class com.guichaguri.trackplayer.module.MusicModule { *; }
-keep class com.guichaguri.trackplayer.service.MusicBinder { *; }
-keep class com.guichaguri.trackplayer.service.MusicManager { *; }
-keep class com.guichaguri.trackplayer.service.player.ExoPlayback { *; }

# Keep JSI position sync classes — accessed via JNI GetMethodID
-keep class cn.toside.music.mobile.position.SyncPositionModule { *; }

-keep class com.reactnativenavigation.views.element.animators.** { *; }
# -keepclassmembers class com.reactnativenavigation.views.element.animators.** { *; }


-keep class org.jaudiotagger.tag.** { *; }


-keep public class com.dylanvann.fastimage.* {*;}
-keep public class com.dylanvann.fastimage.** {*;}
-keep public class * implements com.bumptech.glide.module.GlideModule
-keep public class * extends com.bumptech.glide.module.AppGlideModule
-keep public enum com.bumptech.glide.load.ImageHeaderParser$** {
  **[] $VALUES;
  public *;
}
