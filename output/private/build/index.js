"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const block_basekit_server_api_1 = require("@lark-opdev/block-basekit-server-api");
const { t } = block_basekit_server_api_1.field;
// 通过addDomainList添加请求接口的域名（如果需要处理附件URL）
block_basekit_server_api_1.basekit.addDomainList(['feishu.cn']);
block_basekit_server_api_1.basekit.addField({
    // 定义捷径的i18n语言资源
    i18n: {
        messages: {
            'zh-CN': {
                'file': '附件',
                'filePlaceholder': '请选择附件字段',
                'fileInfo': '附件信息',
                'help_document': '展示附件的详细元信息，包括附件名、大小、格式等',
                'fileName': '附件名',
                'fileSize': '附件大小',
                'fileType': '附件类型',
                'fileUrl': '附件链接(临时)',
                'fileSizeBytes': '附件大小/B',
                'fileSizeKB': '附件大小/KB',
                'fileSizeMB': '附件大小/MB',
                'fileSizeGB': '附件大小/GB',
                'fileExtension': '附件扩展名'
            },
            'en-US': {
                "file": "Attachment",
                "filePlaceholder": "Please select an attachment field",
                "fileInfo": "Attachment Information",
                'help_document': 'Display detailed metadata of attachments, including attachment name, size, format, etc.',
                'fileName': 'Attachment Name',
                'fileSize': 'Attachment Size',
                'fileType': 'Attachment Type',
                'fileUrl': 'Attachment URL (Temporary)',
                'fileSizeBytes': 'Attachment Size / B',
                'fileSizeKB': 'Attachment Size / KB',
                'fileSizeMB': 'Attachment Size / MB',
                'fileSizeGB': 'Attachment Size / GB',
                'fileExtension': 'Attachment Extension'
            },
            'ja-JP': {
                "file": "添付ファイル",
                "filePlaceholder": "添付ファイルフィールドを選択してください",
                "fileInfo": "添付ファイル情報",
                'help_document': '添付ファイル名、サイズ、形式などの添付ファイルの詳細メタデータを表示します',
                'fileName': '添付ファイル名',
                'fileSize': '添付ファイルサイズ',
                'fileType': '添付ファイルタイプ',
                'fileUrl': '添付ファイルURL(一時的)',
                'fileSizeBytes': '添付ファイルサイズ/B',
                'fileSizeKB': '添付ファイルサイズ/KB',
                'fileSizeMB': '添付ファイルサイズ/MB',
                'fileSizeGB': '添付ファイルサイズ/GB',
                'fileExtension': '添付ファイル拡張子'
            },
        }
    },
    // 定义捷径的入参
    formItems: [
        {
            key: 'file',
            label: t('file'),
            component: block_basekit_server_api_1.FieldComponent.FieldSelect,
            props: {
                placeholder: t('filePlaceholder'),
                supportType: [block_basekit_server_api_1.FieldType.Attachment],
            },
            validator: {
                required: true,
            },
            tooltips: [
                {
                    type: 'text',
                    content: t('help_document')
                }
            ],
        },
    ],
    // 定义捷径的返回结果类型
    resultType: {
        type: block_basekit_server_api_1.FieldType.Object,
        extra: {
            icon: {
                light: 'https://lf3-static.bytednsdoc.com/obj/eden-cn/abjayvoz/ljhwZthlaukjlkulzlp/attachment-info-icon.png',
            },
            properties: [
                {
                    key: 'id',
                    type: block_basekit_server_api_1.FieldType.Text,
                    title: 'ID',
                    hidden: true,
                    isGroupByKey: true,
                },
                {
                    key: 'fileName',
                    type: block_basekit_server_api_1.FieldType.Text,
                    title: t('fileName'),
                    primary: true,
                },
                {
                    key: 'fileSize',
                    type: block_basekit_server_api_1.FieldType.Text,
                    title: t('fileSize'),
                },
                {
                    key: 'fileSizeBytes',
                    type: block_basekit_server_api_1.FieldType.Number,
                    title: t('fileSizeBytes'),
                    extra: {
                        formatter: block_basekit_server_api_1.NumberFormatter.DIGITAL_ROUNDED_1,
                    },
                },
                {
                    key: 'fileSizeKB',
                    type: block_basekit_server_api_1.FieldType.Number,
                    title: t('fileSizeKB'),
                    extra: {
                        formatter: block_basekit_server_api_1.NumberFormatter.DIGITAL_ROUNDED_2,
                    },
                },
                {
                    key: 'fileSizeMB',
                    type: block_basekit_server_api_1.FieldType.Number,
                    title: t('fileSizeMB'),
                    extra: {
                        formatter: block_basekit_server_api_1.NumberFormatter.DIGITAL_ROUNDED_2,
                    },
                },
                {
                    key: 'fileSizeGB',
                    type: block_basekit_server_api_1.FieldType.Number,
                    title: t('fileSizeGB'),
                    extra: {
                        formatter: block_basekit_server_api_1.NumberFormatter.DIGITAL_ROUNDED_3,
                    },
                },
                {
                    key: 'fileType',
                    type: block_basekit_server_api_1.FieldType.Text,
                    title: t('fileType'),
                },
                {
                    key: 'fileExtension',
                    type: block_basekit_server_api_1.FieldType.Text,
                    title: t('fileExtension'),
                },
                {
                    key: 'fileUrl',
                    type: block_basekit_server_api_1.FieldType.Text,
                    title: t('fileUrl'),
                },
            ],
        },
    },
    execute: async (formItemParams, context) => {
        const { file } = formItemParams;
        try {
            if (!file || file.length === 0) {
                return {
                    code: block_basekit_server_api_1.FieldCode.ConfigError,
                    msg: 'No attachment field selected. Please select an attachment field.'
                };
            }
            // 获取第一个附件的信息
            const attachment = file[0];
            if (!attachment) {
                return {
                    code: block_basekit_server_api_1.FieldCode.InvalidArgument,
                    msg: 'Invalid attachment data. The selected attachment field contains no valid attachments.'
                };
            }
            console.log('attachment', attachment);
            // 格式化附件大小
            const formatFileSize = (bytes) => {
                if (bytes === 0)
                    return '0 Bytes';
                const k = 1024;
                const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
                const i = Math.floor(Math.log(bytes) / Math.log(k));
                return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
            };
            // 计算不同单位的附件大小
            const calculateFileSizes = (bytes) => {
                const sizeInKB = bytes / 1024;
                const sizeInMB = bytes / (1024 * 1024);
                const sizeInGB = bytes / (1024 * 1024 * 1024);
                return {
                    kb: parseFloat(sizeInKB.toFixed(2)),
                    mb: parseFloat(sizeInMB.toFixed(2)),
                    gb: parseFloat(sizeInGB.toFixed(3))
                };
            };
            // 获取附件扩展名
            const getFileExtension = (filename) => {
                if (!filename || typeof filename !== 'string')
                    return '';
                const lastDot = filename.lastIndexOf('.');
                return lastDot !== -1 ? filename.substring(lastDot + 1).toLowerCase() : '';
            };
            console.log('Processing attachment metadata:', {
                name: attachment.name,
                size: attachment.size,
                type: attachment.type,
                tmp_url: attachment.tmp_url
            });
            const fileSizes = calculateFileSizes(attachment.size || 0);
            return {
                code: block_basekit_server_api_1.FieldCode.Success,
                data: {
                    id: attachment.tmp_url || `${Date.now()}`, // 使用URL作为唯一标识
                    fileName: attachment.name || 'Unknown attachment name',
                    fileSize: formatFileSize(attachment.size || 0),
                    fileSizeBytes: attachment.size || 0,
                    fileSizeKB: fileSizes.kb,
                    fileSizeMB: fileSizes.mb,
                    fileSizeGB: fileSizes.gb,
                    fileType: attachment.type || 'Unknown type',
                    fileExtension: getFileExtension(attachment.name || ''),
                    fileUrl: attachment.tmp_url || '',
                }
            };
        }
        catch (e) {
            console.log("==========Error processing attachment metadata: ", String(e));
            return {
                code: block_basekit_server_api_1.FieldCode.Error,
                msg: 'Failed to process attachment metadata: ' + String(e)
            };
        }
    },
});
exports.default = block_basekit_server_api_1.basekit;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5kZXguanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi9zcmMvaW5kZXgudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7QUFBQSxtRkFBNkg7QUFDN0gsTUFBTSxFQUFFLENBQUMsRUFBRSxHQUFHLGdDQUFLLENBQUM7QUFFcEIsd0NBQXdDO0FBQ3hDLGtDQUFPLENBQUMsYUFBYSxDQUFDLENBQUMsV0FBVyxDQUFDLENBQUMsQ0FBQztBQUVyQyxrQ0FBTyxDQUFDLFFBQVEsQ0FBQztJQUNmLGdCQUFnQjtJQUNoQixJQUFJLEVBQUU7UUFDSixRQUFRLEVBQUU7WUFDUixPQUFPLEVBQUU7Z0JBQ1AsTUFBTSxFQUFFLElBQUk7Z0JBQ1osaUJBQWlCLEVBQUUsU0FBUztnQkFDNUIsVUFBVSxFQUFFLE1BQU07Z0JBQ2xCLGVBQWUsRUFBRSx5QkFBeUI7Z0JBQzFDLFVBQVUsRUFBRSxLQUFLO2dCQUNqQixVQUFVLEVBQUUsTUFBTTtnQkFDbEIsVUFBVSxFQUFFLE1BQU07Z0JBQ2xCLFNBQVMsRUFBRSxVQUFVO2dCQUNyQixlQUFlLEVBQUUsUUFBUTtnQkFDekIsWUFBWSxFQUFFLFNBQVM7Z0JBQ3ZCLFlBQVksRUFBRSxTQUFTO2dCQUN2QixZQUFZLEVBQUUsU0FBUztnQkFDdkIsZUFBZSxFQUFFLE9BQU87YUFDekI7WUFDRCxPQUFPLEVBQUU7Z0JBQ1AsTUFBTSxFQUFFLFlBQVk7Z0JBQ3BCLGlCQUFpQixFQUFFLG1DQUFtQztnQkFDdEQsVUFBVSxFQUFFLHdCQUF3QjtnQkFDcEMsZUFBZSxFQUFFLHlGQUF5RjtnQkFDMUcsVUFBVSxFQUFFLGlCQUFpQjtnQkFDN0IsVUFBVSxFQUFFLGlCQUFpQjtnQkFDN0IsVUFBVSxFQUFFLGlCQUFpQjtnQkFDN0IsU0FBUyxFQUFFLDRCQUE0QjtnQkFDdkMsZUFBZSxFQUFFLHFCQUFxQjtnQkFDdEMsWUFBWSxFQUFFLHNCQUFzQjtnQkFDcEMsWUFBWSxFQUFFLHNCQUFzQjtnQkFDcEMsWUFBWSxFQUFF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