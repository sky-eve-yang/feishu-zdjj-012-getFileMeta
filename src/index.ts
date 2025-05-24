import { basekit, FieldType, field, FieldComponent, FieldCode, NumberFormatter } from '@lark-opdev/block-basekit-server-api';
const { t } = field;

// 通过addDomainList添加请求接口的域名（如果需要处理附件URL）
basekit.addDomainList(['feishu.cn']);

basekit.addField({
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
      component: FieldComponent.FieldSelect,
      props: {
        placeholder: t('filePlaceholder'),
        supportType: [FieldType.Attachment],
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
    type: FieldType.Object,
    extra: {
      icon: {
        light: 'https://lf3-static.bytednsdoc.com/obj/eden-cn/abjayvoz/ljhwZthlaukjlkulzlp/attachment-info-icon.png',
      },
      properties: [
        {
          key: 'id',
          type: FieldType.Text,
          title: 'ID',
          hidden: true,
          isGroupByKey: true,
        },
        {
          key: 'fileName',
          type: FieldType.Text,
          title: t('fileName'),
          primary: true,
        },
        {
          key: 'fileSize',
          type: FieldType.Text,
          title: t('fileSize'),
        },
        {
          key: 'fileSizeBytes',
          type: FieldType.Number,
          title: t('fileSizeBytes'),
          extra: {
            formatter: NumberFormatter.DIGITAL_ROUNDED_1,
          },
        },
        {
          key: 'fileSizeKB',
          type: FieldType.Number,
          title: t('fileSizeKB'),
          extra: {
            formatter: NumberFormatter.DIGITAL_ROUNDED_2,
          },
        },
        {
          key: 'fileSizeMB',
          type: FieldType.Number,
          title: t('fileSizeMB'),
          extra: {
            formatter: NumberFormatter.DIGITAL_ROUNDED_2,
          },
        },
        {
          key: 'fileSizeGB',
          type: FieldType.Number,
          title: t('fileSizeGB'),
          extra: {
            formatter: NumberFormatter.DIGITAL_ROUNDED_3,
          },
        },
        {
          key: 'fileType',
          type: FieldType.Text,
          title: t('fileType'),
        },
        {
          key: 'fileExtension',
          type: FieldType.Text,
          title: t('fileExtension'),
        },
        {
          key: 'fileUrl',
          type: FieldType.Text,
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
          code: FieldCode.ConfigError,
          msg: 'No attachment field selected. Please select an attachment field.'
        }
      }

      // 处理多个附件
      const attachments = file;
      
      // 格式化附件大小
      const formatFileSize = (bytes) => {
        if (bytes === 0) return '0 Bytes';
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
        if (!filename || typeof filename !== 'string') return '';
        const lastDot = filename.lastIndexOf('.');
        return lastDot !== -1 ? filename.substring(lastDot + 1).toLowerCase() : '';
      };
      
      console.log('Processing multiple attachments metadata:', {
        count: attachments.length,
        attachments: attachments.map(att => ({
          name: att.name,
          size: att.size,
          type: att.type
        }))
      });

      // 提取各附件的名称（换行符分割）
      const fileNames = attachments.map(att => att.name || 'Unknown attachment name').join('\n');
      
      // 计算总大小
      const totalSize = attachments.reduce((sum, att) => sum + (att.size || 0), 0);
      const totalSizes = calculateFileSizes(totalSize);
      
      // 提取各附件的类型（换行符分割）
      const fileTypes = attachments.map(att => att.type || 'Unknown type').join('\n');
      
      // 提取各附件的扩展名（换行符分割）
      const fileExtensions = attachments.map(att => getFileExtension(att.name || '')).join('\n');
      
      // 提取各附件的临时链接（换行符分割）
      const fileUrls = attachments.map(att => att.tmp_url || '').join('\n');
      
      // 使用第一个附件的URL作为唯一标识，如果没有则使用时间戳
      const firstAttachment = attachments[0];
      const uniqueId = firstAttachment?.tmp_url || `${Date.now()}`;

      return {
        code: FieldCode.Success,
        data: {
          id: uniqueId,
          fileName: fileNames,
          fileSize: formatFileSize(totalSize),
          fileSizeBytes: totalSize,
          fileSizeKB: totalSizes.kb,
          fileSizeMB: totalSizes.mb,
          fileSizeGB: totalSizes.gb,
          fileType: fileTypes,
          fileExtension: fileExtensions,
          fileUrl: fileUrls,
        }
      }
    } catch (e) {
      console.log("==========Error processing attachment metadata: ", String(e))
      return {
        code: FieldCode.Error,
        msg: 'Failed to process attachment metadata: ' + String(e)
      }
    }

  },
});
export default basekit;