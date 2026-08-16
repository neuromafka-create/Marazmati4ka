!ifndef BUILD_UNINSTALLER
!include "nsDialogs.nsh"
!include "LogicLib.nsh"

Var SKL_SourceDir
Var SKL_Dialog
Var SKL_Edit
Var SKL_Browse

!macro customPageAfterChangeDir
  Page custom sklDocsPageCreate sklDocsPageLeave

  Function sklDocsPageCreate
    nsDialogs::Create 1018
    Pop $SKL_Dialog
    ${If} $SKL_Dialog == error
      Abort
    ${EndIf}

    ${NSD_CreateLabel} 0 0 100% 36u "Папка документов$\r$\nВыберите папку с вашими .md и .txt. Файлы скопируются в блокнот, исходники не изменятся. Пустое поле — пустой блокнот."
    Pop $0

    ${NSD_CreateText} 0 48u 76% 12u "$SKL_SourceDir"
    Pop $SKL_Edit

    ${NSD_CreateButton} 78% 47u 22% 14u "Обзор…"
    Pop $SKL_Browse
    ${NSD_OnClick} $SKL_Browse sklDocsBrowse

    nsDialogs::Show
  FunctionEnd

  Function sklDocsBrowse
    ${NSD_GetText} $SKL_Edit $0
    ${If} $0 == ""
      StrCpy $0 "$DOCUMENTS"
    ${EndIf}
    nsDialogs::SelectFolderDialog "Папка с документами" "$0"
    Pop $0
    ${If} $0 != error
      ${NSD_SetText} $SKL_Edit "$0"
    ${EndIf}
  FunctionEnd

  Function sklDocsPageLeave
    ${NSD_GetText} $SKL_Edit $SKL_SourceDir
    ${If} $SKL_SourceDir != ""
      IfFileExists "$SKL_SourceDir\*.*" skl_ok 0
      MessageBox MB_ICONEXCLAMATION|MB_OK "Папка не найдена. Выберите другую или очистите поле."
      Abort
      skl_ok:
    ${EndIf}
  FunctionEnd
!macroend

!macro customInstall
  ${If} $SKL_SourceDir != ""
    CreateDirectory "$APPDATA\Skleroznik"
    FileOpen $0 "$APPDATA\Skleroznik\source-folder.txt" w
    FileWriteUTF16LE /BOM $0 "$SKL_SourceDir"
    FileClose $0
    FileOpen $0 "$INSTDIR\source-folder.txt" w
    FileWriteUTF16LE /BOM $0 "$SKL_SourceDir"
    FileClose $0
  ${EndIf}
!macroend
!endif
