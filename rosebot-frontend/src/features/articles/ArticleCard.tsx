import DeleteIcon from '@mui/icons-material/Delete'
import EditIcon from '@mui/icons-material/Edit'
import {
    Card,
    CardActions,
    CardContent,
    IconButton,
    Tooltip,
    Typography,
} from '@mui/material'
import type {Article} from '../../types/article'

interface Props {
    article: Article
    onEdit: (article: Article) => void
    onDelete: (id: number) => void
}

export function ArticleCard({article, onEdit, onDelete}: Props) {
    const formattedDate = new Date(article.createdAt).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
    })

    return (
        <Card sx={{height: '100%', display: 'flex', flexDirection: 'column'}}>
            <CardContent sx={{flexGrow: 1}}>
                <Typography variant="h6" gutterBottom noWrap>
                    {article.title}
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{mb: 1}}>
                    {formattedDate}
                </Typography>
                <Typography
                    variant="body2"
                    color="text.primary"
                    sx={{
                        display: '-webkit-box',
                        WebkitLineClamp: 4,
                        WebkitBoxOrient: 'vertical',
                        overflow: 'hidden',
                    }}
                >
                    {article.content}
                </Typography>
            </CardContent>
            <CardActions sx={{justifyContent: 'flex-end'}}>
                <Tooltip title="Edit">
                    <IconButton size="small" onClick={() => onEdit(article)}>
                        <EditIcon fontSize="small"/>
                    </IconButton>
                </Tooltip>
                <Tooltip title="Delete">
                    <IconButton size="small" color="error" onClick={() => onDelete(article.id)}>
                        <DeleteIcon fontSize="small"/>
                    </IconButton>
                </Tooltip>
            </CardActions>
        </Card>
    )
}
