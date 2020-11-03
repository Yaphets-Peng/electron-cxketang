!macro customInstall
  DetailPrint "Register ChaoxingClassroomPc URI Handler"
  DeleteRegKey HKCR "ChaoxingClassroomPc"
  WriteRegStr HKCR "ChaoxingClassroomPc" "" "URL:ChaoxingClassroomPc"
  WriteRegStr HKCR "ChaoxingClassroomPc" "URL Protocol" ""
  WriteRegStr HKCR "ChaoxingClassroomPc\shell" "" ""
  WriteRegStr HKCR "ChaoxingClassroomPc\shell\Open" "" ""
  WriteRegStr HKCR "ChaoxingClassroomPc\shell\Open\command" "" "$INSTDIR\${APP_EXECUTABLE_FILENAME} %1"
!macroend