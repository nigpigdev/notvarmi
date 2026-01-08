'use client';

export default function FileBadge({ url, fileName }) {
    if (!url) return null;

    const name = fileName || url.split('/').pop();
    const extension = name.split('.').pop().toLowerCase();

    const getBadgeStyle = (ext) => {
        switch (ext) {
            case 'pdf':
                return {
                    bg: 'rgba(229, 57, 53, 0.1)',
                    color: '#e53935',
                    border: 'rgba(229, 57, 53, 0.2)',
                    label: 'PDF'
                };
            case 'xls':
            case 'xlsx':
            case 'csv':
                return {
                    bg: 'rgba(67, 160, 71, 0.1)',
                    color: '#43a047',
                    border: 'rgba(67, 160, 71, 0.2)',
                    label: 'EXCEL'
                };
            case 'doc':
            case 'docx':
                return {
                    bg: 'rgba(30, 136, 229, 0.1)',
                    color: '#1e88e5',
                    border: 'rgba(30, 136, 229, 0.2)',
                    label: 'WORD'
                };
            case 'ppt':
            case 'pptx':
                return {
                    bg: 'rgba(251, 140, 0, 0.1)',
                    color: '#fb8c00',
                    border: 'rgba(251, 140, 0, 0.2)',
                    label: 'PPT'
                };
            case 'txt':
                return {
                    bg: 'rgba(117, 117, 117, 0.1)',
                    color: '#757575',
                    border: 'rgba(117, 117, 117, 0.2)',
                    label: 'TXT'
                };
            case 'jpg':
            case 'jpeg':
            case 'png':
            case 'gif':
            case 'webp':
                return {
                    bg: 'rgba(142, 36, 170, 0.1)',
                    color: '#8e24aa',
                    border: 'rgba(142, 36, 170, 0.2)',
                    label: 'IMG'
                };
            default:
                return {
                    bg: 'rgba(158, 158, 158, 0.1)',
                    color: '#616161',
                    border: 'rgba(158, 158, 158, 0.2)',
                    label: ext.toUpperCase().slice(0, 4)
                };
        }
    };

    const style = getBadgeStyle(extension);

    return (
        <a
            href={url}
            download
            onClick={(e) => e.stopPropagation()}
            style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.5rem',
                padding: '0.3rem 0.8rem',
                backgroundColor: style.bg,
                color: style.color,
                border: `1px solid ${style.border}`,
                borderRadius: '6px',
                textDecoration: 'none',
                fontSize: '0.8rem',
                fontWeight: '600',
                transition: 'all 0.2s ease',
                whiteSpace: 'nowrap'
            }}
            onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-1px)';
                e.currentTarget.style.boxShadow = `0 2px 5px ${style.bg}`;
            }}
            onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = 'none';
            }}
            title={name}
        >
            <span style={{ fontWeight: '800' }}>{style.label}</span>
            <span style={{
                opacity: 0.8,
                fontWeight: '400',
                maxWidth: '150px',
                overflow: 'hidden',
                textOverflow: 'ellipsis'
            }}>
                {name}
            </span>
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                <polyline points="7 10 12 15 17 10"></polyline>
                <line x1="12" y1="15" x2="12" y2="3"></line>
            </svg>
        </a>
    );
}
