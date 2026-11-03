; NSIS does not implement the generic builder protocols field. Register the per-user
; Windows handler during installation, including upgrades, before the first app launch.
; The isolated updater lab must never own the real application's protocol.
!macro customInstall
  !if "${APP_ID}" == "app.meldiq.desktop"
    WriteRegStr HKCU "Software\Classes\meldiq" "" "URL:Meldiq"
    WriteRegStr HKCU "Software\Classes\meldiq" "URL Protocol" ""
    WriteRegStr HKCU "Software\Classes\meldiq\DefaultIcon" "" '$\"$INSTDIR\${APP_EXECUTABLE_FILENAME}$\",0'
    WriteRegStr HKCU "Software\Classes\meldiq\shell\open\command" "" '$\"$INSTDIR\${APP_EXECUTABLE_FILENAME}$\" $\"%1$\"'
    System::Call 'shell32::SHChangeNotify(i, i, i, i) v (0x08000000, 0, 0, 0)'
  !endif
!macroend

!macro customUnInstall
  !if "${APP_ID}" == "app.meldiq.desktop"
    ; Preserve a newer installation's ownership and let the new installer replace
    ; registration during an update. Never erase another application's handler.
    ${ifNot} ${isUpdated}
      ReadRegStr $R0 HKCU "Software\Classes\meldiq\shell\open\command" ""
      StrCpy $R1 '$\"$INSTDIR\${APP_EXECUTABLE_FILENAME}$\" $\"%1$\"'
      ${if} $R0 == $R1
        DeleteRegKey HKCU "Software\Classes\meldiq"
        System::Call 'shell32::SHChangeNotify(i, i, i, i) v (0x08000000, 0, 0, 0)'
      ${endIf}
    ${endIf}
  !endif
!macroend
