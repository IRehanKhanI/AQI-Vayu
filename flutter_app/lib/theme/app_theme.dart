import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

class AppColors {
  static const Color oliveLeaf = Color(0xFF606C38);
  static const Color blackForest = Color(0xFF283618);
  static const Color cornsilk = Color(0xFFFEFAE0);
  static const Color sunlitClay = Color(0xFFDDA15E);
  static const Color copperwood = Color(0xFFBC6C25);

  static const Color cardSurface = Color(0xFFF7F3D7);
  static const Color recessedWell = Color(0xFFEFEACC);
  static const Color darkInset = Color(0xFF1E2812);
  static const Color severeRed = Color(0xFFBA1A1A);
  static const Color mutedText = Color(0xFF45483F);
  static const Color secondaryFixed = Color(0xFFDBE9A9);

  static Color fromCategory(String category) {
    switch (category.toLowerCase()) {
      case 'good':
        return oliveLeaf;
      case 'moderate':
        return sunlitClay;
      case 'poor':
        return copperwood;
      case 'severe':
        return severeRed;
      default:
        return sunlitClay;
    }
  }
}

class AppTheme {
  static ThemeData build() {
    final colorScheme = ColorScheme.fromSeed(
      seedColor: AppColors.oliveLeaf,
      brightness: Brightness.light,
      primary: AppColors.oliveLeaf,
      onPrimary: AppColors.cornsilk,
      primaryContainer: AppColors.blackForest,
      onPrimaryContainer: AppColors.cornsilk,
      secondary: AppColors.sunlitClay,
      onSecondary: AppColors.blackForest,
      tertiary: AppColors.copperwood,
      onTertiary: AppColors.cornsilk,
      surface: AppColors.cornsilk,
      onSurface: AppColors.blackForest,
      error: AppColors.severeRed,
    );

    final baseText = GoogleFonts.interTextTheme();

    return ThemeData(
      useMaterial3: true,
      colorScheme: colorScheme,
      scaffoldBackgroundColor: AppColors.cornsilk,
      appBarTheme: AppBarTheme(
        backgroundColor: AppColors.blackForest,
        foregroundColor: AppColors.cornsilk,
        elevation: 4,
        centerTitle: false,
        titleTextStyle: GoogleFonts.plusJakartaSans(
          color: AppColors.cornsilk,
          fontSize: 19,
          fontWeight: FontWeight.w700,
        ),
      ),
      textTheme: baseText.copyWith(
        headlineMedium: GoogleFonts.plusJakartaSans(
          color: AppColors.blackForest,
          fontWeight: FontWeight.w700,
          fontSize: 22,
        ),
        titleLarge: GoogleFonts.plusJakartaSans(
          color: AppColors.blackForest,
          fontWeight: FontWeight.w700,
          fontSize: 18,
        ),
        titleMedium: GoogleFonts.plusJakartaSans(
          color: AppColors.blackForest,
          fontWeight: FontWeight.w600,
          fontSize: 15,
        ),
        bodyMedium: GoogleFonts.inter(
          color: AppColors.blackForest,
          fontSize: 14,
        ),
        bodySmall: GoogleFonts.inter(
          color: AppColors.mutedText,
          fontSize: 12,
        ),
      ),
      cardTheme: CardThemeData(
        color: AppColors.cardSurface,
        elevation: 3,
        shadowColor: AppColors.blackForest.withValues(alpha: 0.14),
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(20),
          side: BorderSide(color: Colors.white.withValues(alpha: 0.7)),
        ),
      ),
      elevatedButtonTheme: ElevatedButtonThemeData(
        style: ElevatedButton.styleFrom(
          backgroundColor: AppColors.copperwood,
          foregroundColor: AppColors.cornsilk,
          elevation: 4,
          padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 16),
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(16),
          ),
          textStyle: GoogleFonts.plusJakartaSans(
            fontSize: 16,
            fontWeight: FontWeight.w700,
          ),
        ),
      ),
      sliderTheme: SliderThemeData(
        activeTrackColor: AppColors.oliveLeaf,
        inactiveTrackColor: AppColors.recessedWell,
        thumbColor: AppColors.copperwood,
        overlayColor: AppColors.sunlitClay.withValues(alpha: 0.25),
        trackHeight: 8,
      ),
      navigationBarTheme: NavigationBarThemeData(
        backgroundColor: AppColors.blackForest,
        indicatorColor: AppColors.oliveLeaf,
        labelTextStyle: WidgetStateProperty.resolveWith((states) {
          final isSelected = states.contains(WidgetState.selected);
          return GoogleFonts.inter(
            color: isSelected ? AppColors.secondaryFixed : AppColors.cornsilk.withValues(alpha: 0.65),
            fontSize: 11,
            fontWeight: isSelected ? FontWeight.w700 : FontWeight.w500,
          );
        }),
        iconTheme: WidgetStateProperty.resolveWith((states) {
          final isSelected = states.contains(WidgetState.selected);
          return IconThemeData(
            color: isSelected ? AppColors.secondaryFixed : AppColors.cornsilk.withValues(alpha: 0.65),
          );
        }),
      ),
    );
  }
}
