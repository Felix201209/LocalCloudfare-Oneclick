#define MyAppName "LocalCloudflare Oneclick"
#define MyAppVersion "0.1.1"
#define MyAppPublisher "Felix201209"
#define MyAppURL "https://github.com/Felix201209/LocalCloudfare-Oneclick"
#define MyAppExeName "scripts\\windows\\localcloudflare-init.cmd"

[Setup]
AppId={{5E3C65D2-4E42-4C62-9E0F-CC9BE0FE768A}
AppName={#MyAppName}
AppVersion={#MyAppVersion}
AppPublisher={#MyAppPublisher}
AppPublisherURL={#MyAppURL}
AppSupportURL={#MyAppURL}
AppUpdatesURL={#MyAppURL}
DefaultDirName={autopf}\LocalCloudflare
DefaultGroupName=LocalCloudflare
AllowNoIcons=yes
LicenseFile=..\LICENSE
OutputDir=..\dist-installer
OutputBaseFilename=LocalCloudflare-Setup
Compression=lzma
SolidCompression=yes
WizardStyle=modern
PrivilegesRequired=admin

[Languages]
Name: "chinesesimp"; MessagesFile: "compiler:Default.isl"

[Tasks]
Name: "desktopicon"; Description: "创建桌面快捷方式"; GroupDescription: "附加任务:"; Flags: unchecked

[Files]
Source: "..\package.json"; DestDir: "{app}"; Flags: ignoreversion
Source: "..\package-lock.json"; DestDir: "{app}"; Flags: ignoreversion
Source: "..\tsconfig.json"; DestDir: "{app}"; Flags: ignoreversion
Source: "..\README.md"; DestDir: "{app}"; Flags: ignoreversion
Source: "..\.env.example"; DestDir: "{app}"; Flags: ignoreversion
Source: "..\LICENSE"; DestDir: "{app}"; Flags: ignoreversion
Source: "..\dist\*"; DestDir: "{app}\dist"; Flags: recursesubdirs ignoreversion
Source: "..\src\*"; DestDir: "{app}\src"; Flags: recursesubdirs ignoreversion
Source: "..\docs\*"; DestDir: "{app}\docs"; Flags: recursesubdirs ignoreversion
Source: "..\scripts\windows\*"; DestDir: "{app}\scripts\windows"; Flags: recursesubdirs ignoreversion

[Icons]
Name: "{group}\初始化向导"; Filename: "{cmd}"; Parameters: "/c \"{app}\scripts\windows\localcloudflare-init.cmd\""
Name: "{group}\启动服务"; Filename: "{cmd}"; Parameters: "/k \"{app}\scripts\windows\localcloudflare-start.cmd\""
Name: "{group}\状态检查"; Filename: "{cmd}"; Parameters: "/k \"{app}\scripts\windows\localcloudflare-status.cmd\""
Name: "{group}\环境检测"; Filename: "{cmd}"; Parameters: "/k \"{app}\scripts\windows\localcloudflare-doctor.cmd\""
Name: "{group}\卸载 LocalCloudflare"; Filename: "{uninstallexe}"
Name: "{autodesktop}\LocalCloudflare 初始化向导"; Filename: "{cmd}"; Parameters: "/c \"{app}\scripts\windows\localcloudflare-init.cmd\""; Tasks: desktopicon

[Run]
Filename: "powershell.exe"; Parameters: "-ExecutionPolicy Bypass -File \"{app}\scripts\windows\postinstall.ps1\" -InstallDir \"{app}\""; Flags: runhidden waituntilterminated; StatusMsg: "正在安装依赖（Node.js/cloudflared/npm 依赖），首次安装可能需要几分钟..."
Filename: "{cmd}"; Parameters: "/k \"{app}\scripts\windows\localcloudflare-doctor.cmd\""; Description: "安装完成后立即进行环境检查"; Flags: postinstall skipifsilent
